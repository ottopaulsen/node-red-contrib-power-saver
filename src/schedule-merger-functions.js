"use strict";

const { DateTime } = require("luxon");
const { msgHasConfig } = require("./utils.js");

/**
 * The minutes of a schedule arrive run-length collapsed (see collapseMinutes in
 * handle-output.js), so one entry covers everything up to the next entry.
 * Turn them into explicit intervals so they can be compared and merged
 * regardless of where each schedule happens to switch.
 *
 * A group lasts until the next group starts. The last group has no next one, so
 * it falls back to its own count, and when that is null - collapseMinutes leaves
 * it null when the source data had no end time - the group is open ended.
 */
function toIntervals(minutes) {
  return (minutes ?? [])
    .map((minute) => ({ startMs: DateTime.fromISO(minute.start).toMillis(), minute }))
    .sort((a, b) => a.startMs - b.startMs)
    .map((interval, i, all) => {
      const next = all[i + 1];
      const count = interval.minute.count;
      const endMs = next ? next.startMs : count == null ? Infinity : interval.startMs + count * 60000;
      return { ...interval, endMs };
    });
}

/**
 * True if the two schedules cover the same period.
 *
 * The end of a collapsed schedule is only known when the last group has a count.
 * Comparing the last entries directly would report a different period whenever
 * two strategies simply make their last switch at different times, which is the
 * normal case, so an unknown end is treated as "no reason to believe it differs".
 */
function coversSamePeriod(minutesA, minutesB) {
  const a = toIntervals(minutesA);
  const b = toIntervals(minutesB);
  if (!a.length || !b.length) {
    return true;
  }
  if (a[0].startMs !== b[0].startMs) {
    return false;
  }
  const endA = a[a.length - 1].endMs;
  const endB = b[b.length - 1].endMs;
  if (endA === Infinity || endB === Infinity) {
    return true;
  }
  return endA === endB;
}

function msgHasSchedule(msg) {
  return msg.payload?.minutes?.length > 0;
}

function validateSchedule() {
  return "";
}

function saveSchedule(node, msg) {
  let savedSchedules = node.context().get("savedSchedules", node.contextStorage) || {};

  // If the saved schedules cover a different period, delete them
  const ids = Object.keys(savedSchedules);
  if (ids.length && !coversSamePeriod(savedSchedules[ids[0]].minutes, msg.payload.minutes)) {
    node.warn("Got schedule with different time. Deleting existing schedules.");
    savedSchedules = {};
  }

  const id = msg.payload.strategyNodeId;
  savedSchedules[id] = structuredClone(msg.payload);
  node.context().set("savedSchedules", savedSchedules);
}

function mergeSchedules(node, logicFunction) {
  const savedSchedules = node.context().get("savedSchedules", node.contextStorage);
  if (!savedSchedules) {
    const msg = "No schedules";
    // node.warn(msg);
    node.status({ fill: "red", shape: "dot", text: msg });
    return [];
  }
  const sourceNodes = Object.keys(savedSchedules);

  // A timestamp where one schedule switches normally sits inside a longer group
  // in the others, so merging per timestamp would only see the schedules that
  // happen to switch at exactly that time. Look every schedule up at each
  // switch point instead.
  const intervals = {};
  const starts = new Map(); // start of a group, in ms -> its original ISO string
  sourceNodes.forEach((strategyNodeId) => {
    intervals[strategyNodeId] = toIntervals(savedSchedules[strategyNodeId].minutes);
    intervals[strategyNodeId].forEach(({ startMs, minute }) => {
      if (!starts.has(startMs)) {
        starts.set(startMs, minute.start);
      }
    });
  });
  const sortedStarts = [...starts.keys()].sort((a, b) => a - b);

  // Merge. The cursors only move forward, since the start times are sorted.
  const cursors = {};
  sourceNodes.forEach((strategyNodeId) => (cursors[strategyNodeId] = 0));
  const mergedMinutes = [];
  sortedStarts.forEach((startMs) => {
    const sources = {};
    sourceNodes.forEach((strategyNodeId) => {
      const sourceIntervals = intervals[strategyNodeId];
      while (
        cursors[strategyNodeId] < sourceIntervals.length &&
        sourceIntervals[cursors[strategyNodeId]].endMs <= startMs
      ) {
        cursors[strategyNodeId]++;
      }
      const interval = sourceIntervals[cursors[strategyNodeId]];
      if (interval && interval.startMs <= startMs) {
        sources[strategyNodeId] = { minute: interval.minute };
      }
    });
    const covering = Object.keys(sources);
    if (!covering.length) {
      // Only possible for an empty group, which covers no time at all.
      return;
    }
    const onOff =
      logicFunction === "OR"
        ? covering.some((s) => sources[s].minute.onOff)
        : covering.every((s) => sources[s].minute.onOff);
    const price = sources[covering[0]].minute.price;
    const saving = null;
    mergedMinutes.push({ start: starts.get(startMs), onOff, sources, price, saving });
  });
  return mergedMinutes;
}

function mergerShallSendSchedule(msg, commands) {
  if (commands.sendSchedule !== undefined) {
    return commands.sendSchedule;
  }
  return msgHasConfig(msg) || msgHasSchedule(msg) || commands.replan;
}

function mergerShallSendOutput(msg, commands, currentOutput, plannedOutputNow, sendCurrentValueWhenRescheduling) {
  if (commands.sendOutput !== undefined) {
    return commands.sendOutput;
  }
  if (msgHasConfig(msg) || msgHasSchedule(msg) || commands.replan) {
    return sendCurrentValueWhenRescheduling ? true : currentOutput !== plannedOutputNow;
  }
  return false;
}

module.exports = {
  msgHasSchedule,
  validateSchedule,
  saveSchedule,
  mergeSchedules,
  mergerShallSendOutput,
  mergerShallSendSchedule,
};

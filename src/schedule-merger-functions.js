"use strict";

const { msgHasConfig } = require("./utils.js");

function msgHasSchedule(msg) {
  return msg.payload.hours?.length > 0;
}

function validateSchedule(msg) {
  return "";
}

function saveSchedule(node, msg) {
  let savedSchedules = node.context().get("savedSchedules", node.contextStorage) || {};

  // If the saved schedule has a different start period, delete them
  const ids = Object.keys(savedSchedules);
  if (ids.length) {
    const lastSaved = savedSchedules[ids[0]].hours.length - 1;
    const lastNew = msg.payload.hours.length - 1;
    if (
      savedSchedules[ids[0]].hours[0].start !== msg.payload.hours[0].start ||
      savedSchedules[ids[0]].hours[lastSaved].start !== msg.payload.hours[lastNew].start
    ) {
      node.warn("Got schedule with different time. Deleting existing schedules.");
      savedSchedules = {};
    }
  }

  const id = msg.payload.strategyNodeId;
  savedSchedules[id] = msg.payload;
  node.context().set("savedSchedules", savedSchedules, node.contextStorage);
}

function mergeSchedules(node, logicFunction) {
  // Transpose all schedules
  const transposed = {};
  const savedSchedules = node.context().get("savedSchedules", node.contextStorage);
  const sourceNodes = Object.keys(savedSchedules);
  sourceNodes.forEach((strategyNodeId) => {
    const hours = savedSchedules[strategyNodeId].hours;
    hours.forEach((hour) => {
      if (!Object.hasOwn(transposed, hour.start)) {
        transposed[hour.start] = {};
      }
      transposed[hour.start][strategyNodeId] = { hour };
    });
  });

  // Sort keys on start time
  const sortedHours = Object.keys(transposed).sort((a, b) => (a > b ? 1 : a === b ? 0 : -1));

  // Merge
  const mergedHours = sortedHours.map((start) => {
    const sources = transposed[start];
    const onOff =
      logicFunction === "OR"
        ? Object.keys(sources).some((s) => sources[s].hour.onOff)
        : Object.keys(sources).every((s) => sources[s].hour.onOff);
    const price = sources[Object.keys(sources)[0]].hour.price;
    const saving = null;
    const res = { start, onOff, sources, price, saving };
    return res;
  });
  return mergedHours;
}

function mergerShallSendSchedule(msg, commands) {
  return msgHasConfig(msg) || msgHasSchedule(msg) ? commands.sendSchedule !== false : !!commands.sendSchedule;
}

module.exports = { msgHasSchedule, validateSchedule, saveSchedule, mergeSchedules, mergerShallSendSchedule };

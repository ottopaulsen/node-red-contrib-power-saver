const { DateTime } = require("luxon");
const { makeSchedule } = require("./utils");
const { handleStrategyInput } = require("./strategy-handle-input");
const { getBestContinuous, getBestX, loadDayData } = require("./strategy-utils");

module.exports = function (RED) {
  function StrategyLowestPriceNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const originalConfig = {
      fromTime: config.fromTime,
      toTime: config.toTime,
      hoursOn: config.hoursOn,
      doNotSplit: config.doNotSplit === true,
      sendCurrentValueWhenRescheduling: config.sendCurrentValueWhenRescheduling ?? true,
      outputIfNoSchedule: config.outputIfNoSchedule ?? false,
      outputOutsidePeriod: config.outputOutsidePeriod ?? false,
    };
    node.context().set("config", originalConfig);

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      handleStrategyInput(node, msg, doPlanning);
    });
  }

  RED.nodes.registerType("ps-strategy-lowest-price", StrategyLowestPriceNode);
};

function doPlanning(node, _, priceData, _, dateDayBefore, _) {
  const dataDayBefore = loadDayData(node, dateDayBefore);
  const values = [...dataDayBefore.hours.map((h) => h.price), ...priceData.map((pd) => pd.value)];
  const startTimes = [...dataDayBefore.hours.map((h) => h.start), ...priceData.map((pd) => pd.start)];

  const from = parseInt(node.fromTime);
  const to = parseInt(node.toTime);
  const periodStatus = [];
  const startIndexes = [];
  const endIndexes = [];
  let currentStatus = from < to ? "Outside" : "StartMissing";
  let hour;
  priceData.forEach((pd, i) => {
    hour = DateTime.fromISO(pd.start).hour;
    if (hour === to && to === from && currentStatus === "Inside") {
      endIndexes.push(i - 1);
    }
    if (hour === to && to !== from) {
      currentStatus = "Outside";
      endIndexes.push(i - 1);
    }
    if (hour === from) {
      currentStatus = "Inside";
      startIndexes.push(i);
    }
    periodStatus[i] = currentStatus;
  });
  if (currentStatus === "Inside" && hour !== (to === 0 ? 23 : to - 1)) {
    // Last period incomplete
    let i = periodStatus.length - 1;
    do {
      periodStatus[i] = "EndMissing";
      hour = DateTime.fromISO(priceData[i].start).hour;
      i--;
    } while (periodStatus[i] === "Inside" && hour !== from);
  }
  if (hour === (to === 0 ? 23 : to - 1)) {
    endIndexes.push(priceData.length - 1);
  }

  const onOff = [];

  // Fill in data from previous plan for StartMissing
  const lastStartMissing = periodStatus.lastIndexOf((s) => s === "StartMissing");
  if (lastStartMissing >= 0 && dataDayBefore?.hours?.length > 0) {
    const lastBefore = DateTime.fromISO(dataDayBefore.hours[dataDayBefore.hours.length - 1].start);
    if (lastBefore >= DateTime.fromISO(priceData[lastStartMissing].start)) {
      for (let i = 0; i <= lastStartMissing; i++) {
        onOff[i] = dataDayBefore.hours.find((h) => h.start === priceData[i].start);
        periodStatus[i] = "Backfilled";
      }
    }
  }

  // Set onOff for hours that will not be planned
  periodStatus.forEach((s, i) => {
    onOff[i] =
      s === "Outside"
        ? node.outputOutsidePeriod
        : s === "StartMissing" || s === "EndMissing"
        ? node.outputIfNoSchedule
        : null;
  });

  startIndexes.forEach((s, i) => {
    makePlan(node, values, onOff, s, endIndexes[i]);
  });

  const schedule = makeSchedule(onOff, startTimes, !onOff[0]);

  const hours = values.map((v, i) => ({
    price: v,
    onOff: onOff[i],
    start: startTimes[i],
    saving: null,
  }));
  return {
    hours,
    schedule,
  };
}

function makePlan(node, values, onOff, fromIndex, toIndex) {
  const valuesInPeriod = values.slice(fromIndex, toIndex + 1);
  const res = node.doNotSplit
    ? getBestContinuous(valuesInPeriod, node.hoursOn)
    : getBestX(valuesInPeriod, node.hoursOn);
  res.forEach((v, i) => {
    onOff[fromIndex + i] = v;
  });
  return onOff;
}

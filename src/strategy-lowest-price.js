const { DateTime } = require("luxon");
const { booleanConfig, makeSchedule, loadDayData } = require("./utils");
const { handleStrategyInput } = require("./handle-input");
const { getBestContinuous, getBestX } = require("./strategy-lowest-price-functions");

module.exports = function (RED) {
  function StrategyLowestPriceNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const originalConfig = {
      fromTime: config.fromTime,
      toTime: config.toTime,
      hoursOn: parseInt(config.hoursOn),
      maxPrice: config.maxPrice == null || config.maxPrice == "" ? null : parseFloat(config.maxPrice),
      doNotSplit: booleanConfig(config.doNotSplit),
      sendCurrentValueWhenRescheduling: booleanConfig(config.sendCurrentValueWhenRescheduling),
      outputIfNoSchedule: booleanConfig(config.outputIfNoSchedule),
      outputOutsidePeriod: booleanConfig(config.outputOutsidePeriod),
      contextStorage: config.contextStorage || "default",
    };
    node.context().set("config", originalConfig);
    node.contextStorage = originalConfig.contextStorage;

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
  let currentStatus = from < (to === 0 && to !== from ? 24 : to) ? "Outside" : "StartMissing";
  let hour;
  startTimes.forEach((st, i) => {
    hour = DateTime.fromISO(st).hour;
    if (hour === to && to === from && currentStatus === "Inside") {
      endIndexes.push(i - 1);
    }
    if (hour === to && to !== from && i > 0 && currentStatus !== "StartMissing") {
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
      hour = DateTime.fromISO(startTimes[i]).hour;
      i--;
    } while (periodStatus[i] === "Inside" && hour !== from);
    startIndexes.splice(startIndexes.length - 1, 1);
  }
  if (hour === (to === 0 ? 23 : to - 1)) {
    endIndexes.push(startTimes.length - 1);
  }

  const onOff = [];

  // Fill in data from previous plan for StartMissing
  const lastStartMissing = periodStatus.lastIndexOf((s) => s === "StartMissing");
  if (lastStartMissing >= 0 && dataDayBefore?.hours?.length > 0) {
    const lastBefore = DateTime.fromISO(dataDayBefore.hours[dataDayBefore.hours.length - 1].start);
    if (lastBefore >= DateTime.fromISO(startTimes[lastStartMissing])) {
      for (let i = 0; i <= lastStartMissing; i++) {
        onOff[i] = dataDayBefore.hours.find((h) => h.start === startTimes[i]);
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
  const sumPriceOn = res.reduce((p, v, i) => {
    p += v ? valuesInPeriod[i] : 0;
  }, 0);
  const average = sumPriceOn / hoursOn;
  res.forEach((v, i) => {
    onOff[fromIndex + i] =
      node.maxPrice == null ? v : node.doNotSplit ? v && average <= node.maxPrice : valuesInPeriod[i] <= node.maxPrice;
  });
  return onOff;
}

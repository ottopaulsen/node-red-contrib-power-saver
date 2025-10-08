const { DateTime } = require("luxon");
const { booleanConfig, calcNullSavings, fixOutputValues, saveOriginalConfig } = require("./utils");
const { getBestContinuous, getBestX } = require("./strategy-lowest-price-functions");
const { strategyOnInput } = require("./strategy-functions");

module.exports = function (RED) {
  function StrategyLowestPriceNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const validConfig = {
      fromHour: config.fromHour,
      fromMinute: config.fromMinute,
      toHour: config.toHour,
      toMinute: config.toMinute,
      minutesOn: parseInt(config.minutesOn),
      maxPrice: config.maxPrice == null || config.maxPrice == "" ? null : parseFloat(config.maxPrice),
      doNotSplit: booleanConfig(config.doNotSplit),
      sendCurrentValueWhenRescheduling: booleanConfig(config.sendCurrentValueWhenRescheduling),
      outputIfNoSchedule: booleanConfig(config.outputIfNoSchedule),
      outputOutsidePeriod: booleanConfig(config.outputOutsidePeriod),
      outputValueForOn: config.outputValueForOn || true,
      outputValueForOff: config.outputValueForOff || false,
      outputValueForOntype: config.outputValueForOntype || "bool",
      outputValueForOfftype: config.outputValueForOfftype || "bool",
      override: "auto",
      contextStorage: config.contextStorage || "default",
    };

    fixOutputValues(validConfig);
    saveOriginalConfig(node, validConfig);

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      strategyOnInput(node, msg, doPlanning, calcNullSavings);
    });
  }
  RED.nodes.registerType("ps-strategy-lowest-price", StrategyLowestPriceNode);
};

function doPlanning(node, priceData) {
  const values = priceData.map((pd) => pd.value);
  const startTimes = priceData.map((pd) => pd.start);

  const fromHour = parseInt(node.fromHour);
  const fromMinute = parseInt(node.fromMinute);
  const toHour = parseInt(node.toHour);
  const toMinute = parseInt(node.toMinute);

  // TODO (otto): This must be rewritten to support minutes

  const from = fromHour * 60 + fromMinute;
  const to = toHour * 60 + toMinute;


  const periodStatus = [];
  const startIndexes = [];
  const endIndexes = [];
  let currentStatus = from < (to === 0 && to !== from ? (24 * 60) : to) ? "Outside" : "StartMissing";
  let hour;
  let minute;
  startTimes.forEach((st, i) => {
    hour = DateTime.fromISO(st).hour;
    minute = hour * 60 + DateTime.fromISO(st).minute;
    if (minute === to && to === from && currentStatus === "Inside") {
      endIndexes.push(i - 1);
    }
    if (minute === to && to !== from && i > 0) {
      if (currentStatus !== "StartMissing") {
        endIndexes.push(i - 1);
      }
      currentStatus = "Outside";
    }
    if (minute === from) {
      currentStatus = "Inside";
      startIndexes.push(i);
    }
    periodStatus[i] = currentStatus;
  });
  if (currentStatus === "Inside" && minute !== (to === 0 ? (23 * 60 + 59) : to - 1)) {
    // Last period incomplete
    let i = periodStatus.length - 1;
    do {
      periodStatus[i] = "EndMissing";
      hour = DateTime.fromISO(startTimes[i]).hour;
      minute = hour * 60 + DateTime.fromISO(startTimes[i]).minute;
      i--;
    } while (periodStatus[i] === "Inside" && minute !== from);
    startIndexes.splice(startIndexes.length - 1, 1);
  }
  if (minute === (to === 0 ? (23 * 60 + 59) : to - 1)) {
    endIndexes.push(startTimes.length - 1);
  }

  const onOff = [];

  // Set onOff for minutes that will not be planned
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

  return onOff;
}

function makePlan(node, values, onOff, fromIndex, toIndex) {
  const valuesInPeriod = values.slice(fromIndex, toIndex + 1);
  const res = node.doNotSplit
    ? getBestContinuous(valuesInPeriod, node.minutesOn)
    : getBestX(valuesInPeriod, node.minutesOn);
  const sumPriceOn = res.reduce((p, v, i) => {
    return p + (v ? valuesInPeriod[i] : 0);
  }, 0);
  const average = sumPriceOn / node.minutesOn;
  res.forEach((v, i) => {
    onOff[fromIndex + i] =
      node.maxPrice == null
        ? v
        : node.doNotSplit
          ? v && average <= node.maxPrice
          : v && valuesInPeriod[i] <= node.maxPrice;
  });
  return onOff;
}

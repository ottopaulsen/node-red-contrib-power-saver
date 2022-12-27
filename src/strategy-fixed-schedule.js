const {
  booleanConfig,
  calcNullSavings,
  fixOutputValues,
  fixPeriods,
  getSavings,
  saveOriginalConfig,
} = require("./utils");
const { strategyOnInput } = require("./strategy-functions");
const { DateTime } = require("luxon");
const cloneDeep = require("lodash.clonedeep");

module.exports = function (RED) {
  function StrategyFixedScheduleNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const validConfig = {
      periods: config.periods || [],
      validFrom: config.validFrom,
      validTo: config.validTo,
      days: config.days || { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
      contextStorage: config.contextStorage || "default",
      outputIfNoSchedule: booleanConfig(config.outputIfNoSchedule),
      outputValueForOn: config.outputValueForOn || true,
      outputValueForOff: config.outputValueForOff || false,
      outputValueForOntype: config.outputValueForOntype || "bool",
      outputValueForOfftype: config.outputValueForOfftype || "bool",
      override: "auto",
      sendCurrentValueWhenRescheduling: config.sendCurrentValueWhenRescheduling,
    };

    fixOutputValues(validConfig);
    fixPeriods(validConfig);
    saveOriginalConfig(node, validConfig);

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      strategyOnInput(node, msg, doPlanning, calcNullSavings);
    });
  }
  RED.nodes.registerType("ps-strategy-fixed-schedule", StrategyFixedScheduleNode);
};

function doPlanning(node, priceData) {
  const startTimes = priceData.map((pd) => pd.start);
  const onOff = startTimes.map(() => node.outputIfNoSchedule);
  const allHours = buildAllHours(node, node.periods);
  const validFrom = DateTime.fromISO(node.validFrom || startTimes[0].substr(0, 10));
  const validTo = DateTime.fromISO(node.validTo || startTimes[startTimes.length - 1].substr(0, 10));
  startTimes.forEach((st, i) => {
    const date = DateTime.fromISO(st.substr(0, 10));
    const hour = DateTime.fromISO(st).hour;
    const day = DateTime.fromISO(st).weekday;
    const dayName = Object.keys(node.days)[day - 1];
    if (date >= validFrom && date <= validTo && node.days[dayName]) {
      onOff[i] = allHours[hour];
    }
  });

  return onOff;
}

function buildAllHours(node, periods) {
  const sortedPeriods = cloneDeep(periods);
  sortedPeriods.sort((a, b) => a.start - b.start);
  let res = [];
  let hour = 0;
  let current = sortedPeriods[sortedPeriods.length - 1];
  sortedPeriods.push({ start: 24, value: null });
  sortedPeriods.forEach((period) => {
    const nextHour = parseInt(period.start);
    while (hour < nextHour) {
      res[hour] = current.value;
      hour++;
    }
    current = period;
  });
  return res;
}

const { DateTime } = require("luxon");
const { makeSchedule, getSavings } = require("./utils");
const { handleStrategyInput } = require("./strategy-handle-input");

module.exports = function (RED) {
  function StrategyLowestPriceNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const originalConfig = {
      fromTime: config.fromTime,
      toTime: config.toTime,
      timeOn: config.timeOn,
      doNotSplit: config.doNotSplit === "true",
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

function doPlanning(node, effectiveConfig, priceData, planFromTime, dateDayBefore, dateToday) {
  const dataDayBefore = loadDayData(node, dateDayBefore);
  const values = [...dataDayBefore.map((db) => db.hours.price), ...priceData.map((pd) => pd.value)];
  const startTimes = [...dataDayBefore.map((db) => db.hours.start), ...priceData.map((pd) => pd.start)];
  const onNow = isTimeInsidePeriod(planFromTime, node.fromTime, node.toTime);

  // Is current time inside period?
  // If so, concatenate data for dayBefore and priceData
  // Plan current period
  // Plan next period

  // The following shall not be used:
  const startAtIndex = getStartAtIndex(effectiveConfig, priceData, planFromTime);
  const dataJustBefore = loadDataJustBefore(node, dateDayBefore, dateToday, startAtIndex);
  const values = priceData.map((d) => d.value).slice(startAtIndex);
  const startTimes = priceData.map((d) => d.start).slice(startAtIndex);
  const onOffBefore = dataJustBefore.hours.map((h) => h.onOff);
  const lastPlanHours = node.context().get("lastPlan")?.hours ?? [];
  const plan = makePlan(node, values, startTimes, onOffBefore);
  const includeFromLastPlanHours = lastPlanHours.filter(
    (h) => h.start < plan.hours[0].start && h.start >= priceData[0].start
  );
  adjustSavingsPassedHours(plan, includeFromLastPlanHours);
  plan.hours.splice(0, 0, ...includeFromLastPlanHours);
}

function makePlan(node, values, startTimes) {
  const startTimesInPeriod = getStartTimesInPeriod(node.fromTime, node.toTime, startTimes);

  const schedule = makeSchedule(onOff, startTimes, lastValueDayBefore);
  const savings = getSavings(values, onOff, firstValueNextDay);
  const hours = values.map((v, i) => ({
    price: v,
    onOff: onOff[i],
    start: startTimes[i],
    saving: savings[i],
  }));
  return {
    hours,
    schedule,
  };
}

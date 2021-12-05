const { countAtEnd, makeSchedule, getSavings, getStartAtIndex, getDiff } = require("./utils");
const { handleStrategyInput } = require("./strategy-handle-input");
const { loadDayData } = require("./strategy-utils");

const mostSavedStrategy = require("./mostSavedStrategy");

module.exports = function (RED) {
  function StrategyBestSaveNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const originalConfig = {
      maxHoursToSaveInSequence: config.maxHoursToSaveInSequence,
      minHoursOnAfterMaxSequenceSaved: config.minHoursOnAfterMaxSequenceSaved,
      minSaving: parseFloat(config.minSaving),
      sendCurrentValueWhenRescheduling: config.sendCurrentValueWhenRescheduling,
      outputIfNoSchedule: config.outputIfNoSchedule === "true",
      scheduleOnlyFromCurrentTime: config.scheduleOnlyFromCurrentTime === "true",
    };
    node.context().set("config", originalConfig);

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      handleStrategyInput(node, msg, doPlanning);
    });
  }
  RED.nodes.registerType("ps-strategy-best-save", StrategyBestSaveNode);
};

function adjustSavingsPassedHours(plan, includeFromLastPlanHours) {
  const firstOnIndex = plan.hours.findIndex((h) => h.onOff);
  if (firstOnIndex < 0) {
    return;
  }
  const nextOnValue = plan.hours[firstOnIndex].price;
  let adjustIndex = includeFromLastPlanHours.length - 1;
  while (adjustIndex >= 0 && !includeFromLastPlanHours[adjustIndex].onOff) {
    includeFromLastPlanHours[adjustIndex].saving = getDiff(includeFromLastPlanHours[adjustIndex].price, nextOnValue);
    adjustIndex--;
  }
}

function loadDataJustBefore(node, dateDayBefore, dateToday, startAtIndex) {
  const dataDayBefore = loadDayData(node, dateDayBefore);
  const dataToday = loadDayData(node, dateToday);
  return {
    schedule: [...dataDayBefore.schedule, ...dataToday.schedule.slice(0, startAtIndex)],
    hours: [...dataDayBefore.hours, ...dataToday.hours.slice(0, startAtIndex)],
  };
}

function doPlanning(node, effectiveConfig, priceData, planFromTime, dateDayBefore, dateToday) {
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
  return plan;
}

function makePlan(node, values, startTimes, onOffBefore, firstValueNextDay) {
  const lastValueDayBefore = onOffBefore[onOffBefore.length - 1];
  const lastCountDayBefore = countAtEnd(onOffBefore, lastValueDayBefore);
  const onOff = mostSavedStrategy.calculate(
    values,
    node.maxHoursToSaveInSequence,
    node.minHoursOnAfterMaxSequenceSaved,
    node.minSaving,
    lastValueDayBefore,
    lastCountDayBefore
  );

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

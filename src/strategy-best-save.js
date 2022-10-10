const { countAtEnd, makeSchedule, getSavings, getDiff } = require("./utils");
const { handleStrategyInput } = require("./handle-input");
const mostSavedStrategy = require("./strategy-best-save-functions");

module.exports = function (RED) {
  function StrategyBestSaveNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const originalConfig = {
      maxHoursToSaveInSequence: config.maxHoursToSaveInSequence,
      minHoursOnAfterMaxSequenceSaved: config.minHoursOnAfterMaxSequenceSaved,
      minSaving: parseFloat(config.minSaving),
      sendCurrentValueWhenRescheduling: config.sendCurrentValueWhenRescheduling,
      outputIfNoSchedule: config.outputIfNoSchedule === "true",
      contextStorage: config.contextStorage || "default",
    };
    node.context().set("config", originalConfig);
    node.contextStorage = originalConfig.contextStorage;

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      handleStrategyInput(node, msg, doPlanning, getSavings);
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

function doPlanning(node, _, priceData, _, dateDayBefore, _, dataJustBefore) {
  // const dataJustBefore = loadDataJustBefore(node, dateDayBefore);
  const values = priceData.map((d) => d.value);
  const startTimes = priceData.map((d) => d.start);
  const onOffBefore = dataJustBefore.hours.map((h) => h.onOff);
  const lastPlanHours = node.context().get("lastPlan", node.contextStorage)?.hours ?? [];
  const plan = makePlan(node, values, startTimes, onOffBefore);
  return plan;

  // const includeFromLastPlanHours = lastPlanHours.filter(
  //   (h) => h.start < plan.hours[0].start && h.start >= priceData[0].start
  // );
  // adjustSavingsPassedHours(plan, includeFromLastPlanHours);
  // plan.hours.splice(0, 0, ...includeFromLastPlanHours);
  // return plan;
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

  return onOff;

  // const schedule = makeSchedule(onOff, startTimes, lastValueDayBefore);
  // const savings = getSavings(values, onOff, firstValueNextDay);
  // const hours = values.map((v, i) => ({
  //   price: v,
  //   onOff: onOff[i],
  //   start: startTimes[i],
  //   saving: savings[i],
  // }));
  // return {
  //   hours,
  //   schedule,
  // };
}

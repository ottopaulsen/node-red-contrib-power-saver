const { DateTime } = require("luxon");
const {
  countAtEnd,
  makeSchedule,
  getSavings,
  extractPlanForDate,
  getStartAtIndex,
  getDiff,
  validationFailure,
} = require("./utils");
const { getEffectiveConfig, runSchedule, validateInput } = require("./strategy-utils");

let schedulingTimeout = null;

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
      clearTimeout(schedulingTimeout);
    });

    node.on("input", function (msg) {
      const effectiveConfig = getEffectiveConfig(node, msg);
      if (!validateInput(node, msg)) {
        return;
      }
      const priceData = msg.payload;
      const planFromTime = msg.payload.time ?? DateTime.now();

      // Store config variables in node
      Object.keys(effectiveConfig).forEach((key) => (node[key] = effectiveConfig[key]));

      clearTimeout(schedulingTimeout);

      const values = priceData.map((d) => d.value).slice(startAtIndex);
      const startTimes = priceData.map((d) => d.start).slice(startAtIndex);
      const plan = makePlan(node, values, startTimes);

      // // OLD CODE:

      // const dates = [...new Set(priceData.map((v) => DateTime.fromISO(v.start).toISODate()))];

      // // Load data from day before
      // const dateToday = DateTime.fromISO(dates[0]);
      // const dateDayBefore = DateTime.fromISO(dates[0]).plus({ days: -1 });

      // // Make plan
      // const startAtIndex = getStartAtIndex(effectiveConfig, priceData, planFromTime);
      // const dataJustBefore = loadDataJustBefore(node, dateDayBefore, dateToday, startAtIndex);
      // const values = priceData.map((d) => d.value).slice(startAtIndex);
      // const startTimes = priceData.map((d) => d.start).slice(startAtIndex);
      // const onOffBefore = dataJustBefore.hours.map((h) => h.onOff);
      // const lastPlanHours = node.context().get("lastPlan")?.hours ?? [];
      // const plan = makePlan(node, values, startTimes, onOffBefore);
      // const includeFromLastPlanHours = lastPlanHours.filter(
      //   (h) => h.start < plan.hours[0].start && h.start >= priceData[0].start
      // );
      // adjustSavingsPassedHours(plan, includeFromLastPlanHours);
      // plan.hours.splice(0, 0, ...includeFromLastPlanHours);

      // // Save schedule
      // node.context().set("lastPlan", plan);
      // dates.forEach((d) => saveDayData(node, d, extractPlanForDate(plan, d)));

      // Prepare output
      let output1 = null;
      let output2 = null;
      let output3 = {
        payload: {
          schedule: plan.schedule,
          hours: plan.hours,
          source: priceData.source,
          config: effectiveConfig,
        },
      };

      // Find current output, and set output (if configured to do)
      const pastSchedule = plan.schedule.filter((entry) => DateTime.fromISO(entry.time) <= planFromTime);

      if (pastSchedule.length > 0) {
        const currentValue = pastSchedule[pastSchedule.length - 1].value;
        output1 = currentValue ? { payload: true } : null;
        output2 = currentValue ? null : { payload: false };
      }

      // Delete old data
      deleteSavedScheduleBefore(node, dateDayBefore);

      // Send output
      node.send([output1, output2, output3]);

      // Run schedule
      schedulingTimeout = runSchedule(node, plan.schedule, planFromTime);
    });
  }

  RED.nodes.registerType("ps-strategy-best-save", StrategyLowestPriceNode);
};

function makePlan(node, values, startTimes, onOffBefore, firstValueNextDay) {
  const strategy = "mostSaved"; // TODO: Get from node settings
  const lastValueDayBefore = onOffBefore[onOffBefore.length - 1];
  const lastCountDayBefore = countAtEnd(onOffBefore, lastValueDayBefore);
  const onOff =
    strategy === "mostSaved"
      ? mostSavedStrategy.calculate(
          values,
          node.maxHoursToSaveInSequence,
          node.minHoursOnAfterMaxSequenceSaved,
          node.minSaving,
          lastValueDayBefore,
          lastCountDayBefore
        )
      : [];

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

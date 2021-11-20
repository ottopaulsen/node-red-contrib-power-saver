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

const mostSavedStrategy = require("./mostSavedStrategy");

let schedulingTimeout = null;

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
      clearTimeout(schedulingTimeout);
    });

    node.on("input", function (msg) {
      const effectiveConfig = getEffectiveConfig(node, msg);
      if (!validateInput(node, msg)) {
        return;
      }
      const priceData = msg.payload.priceData;
      const planFromTime = msg.payload.time ?? DateTime.now();

      // Store config variables in node
      Object.keys(effectiveConfig).forEach((key) => (node[key] = effectiveConfig[key]));

      clearTimeout(schedulingTimeout);

      const dates = [...new Set(priceData.map((v) => DateTime.fromISO(v.start).toISODate()))];

      // Load data from day before
      const dateToday = DateTime.fromISO(dates[0]);
      const dateDayBefore = DateTime.fromISO(dates[0]).plus({ days: -1 });

      // Make plan
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

      // Save schedule
      node.context().set("lastPlan", plan);
      dates.forEach((d) => saveDayData(node, d, extractPlanForDate(plan, d)));

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

      if (node.sendCurrentValueWhenRescheduling && pastSchedule.length > 0) {
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

function loadDayData(node, date) {
  // Load saved schedule for the date (YYYY-MM-DD)
  // Return null if not found
  const key = date.toISODate();
  const saved = node.context().get(key);
  const res = saved ?? {
    schedule: [],
    hours: [],
  };
  return res;
}

function loadDataJustBefore(node, dateDayBefore, dateToday, startAtIndex) {
  const dataDayBefore = loadDayData(node, dateDayBefore);
  const dataToday = loadDayData(node, dateToday);
  return {
    schedule: [...dataDayBefore.schedule, ...dataToday.schedule.slice(0, startAtIndex)],
    hours: [...dataDayBefore.hours, ...dataToday.hours.slice(0, startAtIndex)],
  };
}

function saveDayData(node, date, plan) {
  node.context().set(date, plan);
}

function deleteSavedScheduleBefore(node, day) {
  let date = day;
  do {
    date = date.plus({ days: -1 });
    data = node.context().get(date.toISO());
  } while (data);
}

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

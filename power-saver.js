const { DateTime } = require("luxon");
const { convertMsg, countAtEnd, makeSchedule, getSavings } = require("./utils");
const mostSavedStrategy = require("./mostSavedStrategy");

let schedulingTimeout = null;

module.exports = function (RED) {
  function PowerSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Save config in node
    this.maxHoursToSavePerDay = config.maxHoursToSavePerDay;
    this.maxHoursToSaveInSequence = config.maxHoursToSaveInSequence;
    this.minHoursOnAfterMaxSequenceSaved =
      config.minHoursOnAfterMaxSequenceSaved;
    this.minSaving = config.minSaving;
    this.sendCurrentValueWhenRescheduling =
      config.sendCurrentValueWhenRescheduling;
    this.outputIfNoSchedule = config.outputIfNoSchedule === "true";

    node.on("close", function () {
      clearTimeout(schedulingTimeout);
    });

    node.on("input", function (msg) {
      if (!validateMsg(node, msg)) {
        return;
      }

      const input = convertMsg(msg);
      if (!validateInput(node, input)) {
        return;
      }

      const today = input.today;
      const tomorrow = input.tomorrow;
      const source = input.source;

      clearTimeout(schedulingTimeout);

      // Set dates
      const todaysDate = DateTime.fromISO(today[0].start.substr(0, 10));
      const yesterdayDate = todaysDate.plus({ days: -1 });
      const tomorrowDate = todaysDate.plus({ days: 1 });

      // Load data from yesterday
      const dataYesterday = loadDayData(node, yesterdayDate);

      // Make plan
      const valuesToday = today.map((d) => d.value);
      const valuesTomorrow = tomorrow.map((d) => d.value);
      const startTimesToday = today.map((d) => d.start);
      const startTimesTomorrow = tomorrow.map((d) => d.start);

      const planToday = makePlan(
        node,
        valuesToday,
        startTimesToday,
        dataYesterday.onOff
      );
      const planTomorrow = makePlan(
        node,
        valuesTomorrow,
        startTimesTomorrow,
        planToday.onOff
      );

      // Save schedule
      saveDayData(node, todaysDate, planToday);
      saveDayData(node, tomorrowDate, planTomorrow);

      // Combine data for today and tomorrow
      const schedule = [...planToday.schedule, ...planTomorrow.schedule];
      const hours = [...planToday.hours, ...planTomorrow.hours];

      // Prepare output
      let output1 = null;
      let output2 = null;
      let output3 = {
        payload: {
          schedule,
          hours,
          source,
        },
      };

      // Find current output, and set output (if configured to do)
      const time = msg.payload.time
        ? DateTime.fromISO(msg.payload.time)
        : DateTime.now();
      const pastSchedule = schedule.filter(
        (entry) => DateTime.fromISO(entry.time) <= time
      );
      const outputCurrent = node.sendCurrentValueWhenRescheduling;

      if (outputCurrent && pastSchedule.length > 0) {
        const currentValue = pastSchedule[pastSchedule.length - 1].value;
        output1 = currentValue ? { payload: true } : null;
        output2 = currentValue ? null : { payload: false };
      }

      // Delete old data
      deleteSavedScheduleBefore(node, yesterdayDate);

      // Send output
      node.send([output1, output2, output3]);

      // Run schedule
      schedulingTimeout = runSchedule(node, schedule, time);
    });
  }

  RED.nodes.registerType("power-saver", PowerSaverNode);
};

function loadDayData(node, date) {
  // Load saved schedule for the date (YYYY-MM-DD)
  // Return null if not found
  const key = date.toISO();
  return (
    node.context().get(key) || {
      values: [],
      onOff: [],
      startTimes: [],
      schedule: [],
      savings: [],
    }
  );
}

function saveDayData(node, date, plan) {
  const key = date.toISO();
  node.context().set(key, plan);
}

function deleteSavedScheduleBefore(node, day) {
  let date = day;
  do {
    date = date.plus({ days: -1 });
    data = node.context().get(date.toISO());
  } while (data);
}

function makePlan(node, values, startTimes, onOffBefore) {
  const strategy = "mostSaved"; // TODO: Get from node settings
  const lastValueDayBefore = onOffBefore[onOffBefore.length - 1];
  const lastCountDayBefore = countAtEnd(onOffBefore, lastValueDayBefore);
  const onOff =
    strategy === "mostSaved"
      ? mostSavedStrategy.calculate(
          values,
          node.maxHoursToSavePerDay,
          node.maxHoursToSaveInSequence,
          node.minHoursOnAfterMaxSequenceSaved,
          node.minSaving,
          lastValueDayBefore,
          lastCountDayBefore
        )
      : [];

  const schedule = makeSchedule(onOff, startTimes, lastValueDayBefore);
  const savings = getSavings(values, onOff);
  const hours = values.map((v, i) => ({
    price: v,
    onOff: onOff[i],
    start: startTimes[i],
    saving: savings[i],
  }));
  return {
    hours,
    schedule,
    onOff,
  };
}

function validationFailure(node, message) {
  node.status({ fill: "red", shape: "ring", text: message });
  node.warn(message);
}

function validateMsg(node, msg) {
  if (!msg.payload && !msg.data?.new_state?.attributes) {
    validationFailure(node, "Payload missing");
    return false;
  }
  const payload = msg.data?.new_state?.attributes ?? msg.payload;
  if (typeof payload !== "object") {
    validationFailure(node, "Payload must be an object");
    return false;
  }
  return true;
}

function validateInput(node, input) {
  ["today", "tomorrow"].forEach((arr) => {
    if (
      input[arr].some((day) => {
        return day.start === undefined || day.value === undefined;
      })
    ) {
      validationFailure(
        node,
        `Malformed entries in payload.${arr}. All entries must contain start and value.`
      );
    }
  });
  if (!input.today.length && !input.tomorrow.length) {
    validationFailure(node, "Payload has no data");
    return false;
  }

  return true;
}

/**
 * Start a timer until the next time in the schedule.
 * When the time is out, send the relaed value and start timer for next time.
 * @param {*} node
 * @param {*} schedule
 * @param {*} time
 */
function runSchedule(node, schedule, time) {
  let currentTime = time;
  let remainingSchedule = schedule.filter(
    (entry) => DateTime.fromISO(entry.time) > time
  );
  if (remainingSchedule.length > 0) {
    const entry = remainingSchedule[0];
    const nextTime = DateTime.fromISO(entry.time);
    const wait = nextTime - currentTime;
    const onOff = entry.value ? "on" : "off";
    node.log("Switching " + onOff + " in " + wait + " milliseconds");
    const statusMessage = `Scheduled ${
      remainingSchedule.length
    } changes. Next: ${remainingSchedule[0].value ? "on" : "off"}`;
    node.status({ fill: "green", shape: "dot", text: statusMessage });
    return setTimeout(() => {
      sendSwitch(node, entry.value);
      schedulingTimeout = runSchedule(node, remainingSchedule, nextTime);
    }, wait);
  } else {
    const message = "No schedule";
    node.warn(message);
    node.status({ fill: "red", shape: "dot", text: message });
    sendSwitch(node, node.outputIfNoSchedule);
  }
}

function sendSwitch(node, onOff) {
  const output1 = onOff ? { payload: true } : null;
  const output2 = onOff ? null : { payload: false };
  node.send([output1, output2, null]);
}

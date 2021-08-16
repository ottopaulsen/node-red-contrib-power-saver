const { DateTime } = require("luxon");

let schedulingTimeout = null;

// TODO
// Add topics to output. Maybe configurable on the node.
// Make node config values.

module.exports = function (RED) {
  function PowerSaverNode(config) {
    RED.nodes.createNode(this, config);

    // Save config in node
    this.maxHoursToSavePerDay = config.maxHoursToSavePerDay;
    this.maxHoursToSaveInSequence = config.maxHoursToSaveInSequence;
    this.minHoursOnAfterMaxSequenceSaved =
      config.minHoursOnAfterMaxSequenceSaved;
    this.sendCurrentValueWhenRescheduling =
      config.sendCurrentValueWhenRescheduling;

    const node = this;

    node.on("close", function () {
      node.log("Clearing timeout");
      clearTimeout(schedulingTimeout);
    });

    node.on("input", function (msg) {
      if (!validateInput(node, msg)) {
        return;
      }

      clearTimeout(schedulingTimeout);

      // Get input data from msg
      const rawToday = msg.payload.raw_today;
      const rawTomorrow = msg.payload.raw_tomorrow;

      // Set dates
      const todaysDate = DateTime.fromISO(rawToday[0].start.substr(0, 10));
      const yesterdayDate = todaysDate.plus({ days: -1 });
      const tomorrowDate = todaysDate.plus({ days: 1 });

      // Load data from yesterday
      const dataYesterday = loadDayData(node, yesterdayDate);

      // Make new schedule
      const scheduleToday = makeSchedule(node, rawToday, dataYesterday);
      const scheduleTomorrow = makeSchedule(node, rawTomorrow, scheduleToday);

      // Save schedule
      saveDayData(node, todaysDate, scheduleToday);
      saveDayData(node, tomorrowDate, scheduleTomorrow);

      // Combine schedule for today and tomorrow
      const schedule = [
        ...scheduleToday.onOffSchedule,
        ...scheduleTomorrow.onOffSchedule,
      ];

      // Prepare output
      let output1 = null;
      let output2 = null;
      let output3 = {
        payload: {
          today: scheduleToday.highestSelected,
          tomorrow: scheduleTomorrow.highestSelected,
          schedule,
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
      highestSelected: [],
      onOffSchedule: [],
    }
  );
}

function saveDayData(node, date, data) {
  const key = date.toISO();
  node.context().set(key, data);
}

function deleteSavedScheduleBefore(node, day) {
  let date = day;
  do {
    date = date.plus({ days: -1 });
    data = node.context().get(date.toISO());
  } while (data);
}

function makeSchedule(node, dayData, dayBeforeData) {
  node.log(
    `Making schedule with maxHoursToSavePerDay=${node.maxHoursToSavePerDay}, maxHoursToSaveInSequence=${node.maxHoursToSaveInSequence} and minHoursOnAfterMaxSequenceSaved=${node.minHoursOnAfterMaxSequenceSaved}`
  );
  const values = dayData.map((d) => d.value);
  const savingSelected = highestSelected(
    values,
    node.maxHoursToSavePerDay || 12,
    node.maxHoursToSaveInSequence || 3,
    node.minHoursOnAfterMaxSequenceSaved || 2,
    dayBeforeData.highestSelected
  );
  const startTimes = dayData.map((d) => d.start);
  const onOffSchedule = makeOnOffSchedule(startTimes, savingSelected);
  return { onOffSchedule, highestSelected: savingSelected };
}

function validationFailure(node, message) {
  node.status({ fill: "red", shape: "ring", text: message });
  node.warn(message);
}

function validateInput(node, msg) {
  if (!msg.payload) {
    validationFailure(node, "Payload missing");
    return false;
  }
  const payload = msg.payload;
  if (typeof payload !== "object") {
    validationFailure(node, "Payload must be an object");
    return false;
  }
  ["raw_today", "raw_tomorrow"].forEach((arr) => {
    if (!payload[arr]) {
      validationFailure(node, `Payload is missing ${arr} array`);
      return false;
    }
    if (
      payload[arr].some((day) => {
        return (
          day.start === undefined ||
          day.end === undefined ||
          day.value === undefined
        );
      })
    ) {
      validationFailure(
        node,
        `Malformed entries in payload.${arr}. All entries must contain start, end and value.`
      );
    }
  });
  if (!payload.raw_today.length && !payload.raw_today.length) {
    validationFailure(node, "Payload has no data");
    return false;
  }

  return true;
}

/**
 * Sort values in array and return array with index of original array
 * in sorted order. Highes value first.
 */
function sortedIndex(valueArr) {
  const mapped = valueArr.map((v, i) => {
    return { i, value: v };
  });
  const sorted = mapped.sort((a, b) => {
    if (a.value > b.value) {
      return -1;
    }
    if (a.value < b.value) {
      return 1;
    }
    return 0;
  });
  return sorted.map((p) => p.i);
}

function isTrueFalseSequencesOk(sequences, maxTrue, minFalseAfterTrue) {
  let trueCount = 0;
  let falseCount = 0;
  let reachedMaxTrue = false;
  for (let i = 0; i < sequences.length; i++) {
    if (sequences[i]) {
      if (reachedMaxTrue) {
        return false;
      }
      trueCount++;
      falseCount = 0;
      if (trueCount === maxTrue) {
        reachedMaxTrue = true;
      }
    } else {
      if (reachedMaxTrue) {
        falseCount++;
        if (falseCount === minFalseAfterTrue) {
          reachedMaxTrue = false;
        }
      }
      trueCount = 0;
    }
  }
  return true;
}

function highestSelected(
  values,
  maxSelectedCount,
  maxSelectedInARow,
  minCountAfterMaxInARow,
  highestSelectedDayBefore
) {
  const sorted = sortedIndex(values);
  const res = new Array(values.length).fill(false);
  let i = 0;
  let count = 0;
  while (i < values.length && count < maxSelectedCount) {
    const index = sorted[i];
    res[index] = true;
    const dataToCheck = [...highestSelectedDayBefore, ...res];
    if (
      !isTrueFalseSequencesOk(
        dataToCheck,
        maxSelectedInARow,
        minCountAfterMaxInARow
      )
    ) {
      res[index] = false;
    }
    count = res.reduce((sum, val) => {
      return sum + (val ? 1 : 0);
    }, 0);
    i++;
  }
  return res;
}

function makeOnOffSchedule(startTimes, savingSelected, initial = undefined) {
  const res = [];
  let prev = initial;
  for (let i = 0; i < startTimes.length; i++) {
    const value = !savingSelected[i];
    if (value !== prev) {
      const time = startTimes[i];
      res.push({ time, value });
      prev = value;
    }
  }
  return res;
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
      const output1 = entry.value ? { payload: true } : null;
      const output2 = entry.value ? null : { payload: false };
      node.send([output1, output2, null]);
      schedulingTimeout = runSchedule(node, remainingSchedule, nextTime);
    }, wait);
  } else {
    const message = "No schedule";
    node.warn(message);
    node.status({ fill: "red", shape: "dot", text: message });
  }
}

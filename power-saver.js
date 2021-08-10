const { DateTime } = require("luxon");

let schedulingTimeout = null;

// TODO
// Fix so tomorrow does not repeat switch off (false) when already off the day before
// Make sure tomorrows schedule depends on todays schedule
// Check if the today/tomorrow logic is necessary now when there is only one resulting schedule.
// Save data for the date. Use complete start-time as key for testing to work.
// Check what output on out1 and out1 needs to be.
// Add topics to output. Maybe configurable on the node.
// Make node config values.

module.exports = function (RED) {
  function PowerSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const nodeContext = node.context();
    const powerData = readPowerDataFromStorage(nodeContext);

    node.on("close", function () {
      node.log("Clearing timeout");
      clearTimeout(schedulingTimeout);
    });

    node.on("input", function (msg) {
      // console.log("Got input: ", msg);
      if (!validateInput(node, msg)) {
        return;
      }

      const rawToday = msg.payload.raw_today;
      const rawTomorrow = msg.payload.raw_tomorrow;
      const todaysDate = DateTime.fromISO(rawToday[0].start.substr(0, 10));
      const yesterdayDate = todaysDate.plus({ days: -1 }).toISODate();

      const scheduleToday =
        loadSavedSchedule(todaysDate) ??
        makeSchedule(rawToday, loadSavedSchedule(yesterdayDate) ?? []);
      const scheduleTomorrow =
        rawTomorrow.length > 0 ? makeSchedule(rawTomorrow) : [];

      const schedule = [...scheduleToday, ...scheduleTomorrow];

      let output1 = null;
      let output2 = null;
      let output3 = {
        payload: schedule,
      };

      //
      const time = msg.payload.time
        ? DateTime.fromISO(msg.payload.time)
        : DateTime.now();
      const pastSchedule = schedule.filter(
        (entry) => DateTime.fromISO(entry.time) <= time
      );
      const outputCurrent = true;
      if (outputCurrent && pastSchedule.length > 0) {
        const currentValue = pastSchedule[pastSchedule.length - 1].value;
        output1 = currentValue ? { payload: true } : null;
        output2 = currentValue ? null : { payload: false };
      }

      deleteSavedScheduleBefore(yesterdayDate);
      console.log(schedule);
      node.send([output1, output2, output3]);
      schedulingTimeout = runSchedule(node, schedule, time);
    });
  }
  RED.nodes.registerType("power-saver", PowerSaverNode);
};

function loadSavedSchedule(date) {
  // Load saved schedule for the date (YYYY-MM-DD)
  // Return null if not found
  return null;
}

function deleteSavedScheduleBefore(day) {}

function makeSchedule(dayData, dayBeforeSchedule) {
  const values = dayData.map((d) => d.value);
  const savingSelected = highestSelected(values, 12, 3, 2);
  const startTimes = dayData.map((d) => d.start);
  const onOffSchedule = makeOnOffSchedule(startTimes, savingSelected);
  // console.log({
  //   dayData,
  //   dayBeforeSchedule,
  //   values,
  //   savingSelected,
  //   onOffSchedule,
  // });
  return onOffSchedule;
}

function validateInput(node, msg) {
  if (!msg.payload) {
    node.warn("Payload missing");
    return false;
  }
  const payload = msg.payload;
  if (typeof payload !== "object") {
    node.warn("Payload must be an object");
    return false;
  }
  ["raw_today", "raw_tomorrow"].forEach((arr) => {
    if (!payload[arr]) {
      node.warn(`Payload is missing ${arr} array`);
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
      node.warn(
        `Malformed entries in payload.${arr}. All entries must contain start, end and value.`
      );
    }
  });
  if (!payload.raw_today.length && !payload.raw_today.length) {
    node.warn("Payload has no data");
    return false;
  }

  return true;
}

function readPowerDataFromStorage(context) {
  const powerData = {
    prices: {
      today: undefined,
      tomorrow: undefined,
    },
    schedule: {
      today: undefined,
      tomorrow: undefined,
    },
  };
  return powerData;
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

function sequenceLengths(onOffArr) {
  if (onOffArr.length === 0) {
    return [];
  }
  const res = new Array(onOffArr.length);
  let start = 0;
  let count = 1;
  let val = onOffArr[0];
  while (start + count < onOffArr.length) {
    if (onOffArr[start + count] !== val) {
      for (let i = start; i < start + count; i++) {
        res[i] = count;
      }
      start = start + count;
      count = 1;
      val = onOffArr[start];
    } else {
      count++;
    }
  }
  for (let i = start; i < start + count; i++) {
    res[i] = count;
  }
  return res;
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
  minCountAfterMaxInARow
) {
  const sorted = sortedIndex(values);
  const res = new Array(values.length).fill(false);
  let i = 0;
  let count = 0;
  while (i < values.length && count < maxSelectedCount) {
    const index = sorted[i];
    res[index] = true;
    if (
      !isTrueFalseSequencesOk(res, maxSelectedInARow, minCountAfterMaxInARow)
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
    return setTimeout(() => {
      const output1 = entry.value ? { payload: true } : null;
      const output2 = entry.value ? null : { payload: false };
      node.send([output1, output2, null]);
      schedulingTimeout = runSchedule(node, remainingSchedule, nextTime);
    }, wait);
  } else {
    node.warn("No more schedule");
  }
}

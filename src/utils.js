const { DateTime } = require("luxon");

function booleanConfig(value) {
  return value === "true" || value === true;
}

/**
 * Sort values in array and return array with index of original array
 * in sorted order. Highest value first.
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

/**
 * Receive an array with values, and another array (same size) with
 * true (on) and false (off) values.
 * Returns an array with the difference between the current value
 * and the next value that is on.
 * If there is no next value that is on, the nextOn value is used.
 * Positive difference is when the current value is higher than the next on.
 *
 * @param {*} values Array of prices
 * @param {*} onOff Array of booleans, where true means on, false means off
 * @param {*} nextOn Value for the next hour on after the whole values array,
 *                   to use for the last hours.
 * @returns Array with diff to next hour that is on. May be negative.
 *
 */
function getDiffToNextOn(values, onOff, nextOn = null) {
  const nextOnValue = nextOn ?? values[values.length - 1];
  const res = values.map((p, i, a) => {
    for (let n = i + 1; n < a.length; n++) {
      if (onOff[n]) {
        return getDiff(values[i], values[n]);
      }
    }
    return getDiff(p, nextOnValue);
  });
  return res;
}

function getDiff(large, small) {
  return roundPrice(large - small);
}

function getEffectiveConfig(node, msg) {
  const res = node.context().get("config");
  if (!res) {
    node.error("Node has no config");
    return {};
  }
  const isConfigMsg = !!msg?.payload?.config;
  if (isConfigMsg) {
    const inputConfig = msg.payload.config;
    Object.keys(inputConfig).forEach((key) => {
      res[key] = inputConfig[key];
    });
    node.context().set("config", res);
  }
  return res;
}

function loadDayData(node, date) {
  // Load saved schedule for the date (YYYY-MM-DD)
  // Return null if not found
  const key = date.toISODate();
  const saved = node.context().get(key, node.contextStorage);
  const res = saved ?? {
    schedule: [],
    hours: [],
  };
  return res;
}

function roundPrice(value) {
  return Math.round(value * 10000) / 10000;
}

/**
 *
 * @param {*} values Array of prices
 * @param {*} onOff Array of booleans, where true means on, false means off
 * @param {*} nextOn Value for the next hour on after the whole values array,
 *                   to use for the last hours.
 * @returns Array with how much you save on the off-hours, null on the others.
 */
function getSavings(values, onOff, nextOn = null) {
  return getDiffToNextOn(values, onOff, nextOn).map((v, i) => (onOff[i] ? null : v));
}

/**
 * Takes an array of values and an array of true/valse values (same size).
 * Returns the value from the first array
 * corresponding to the first true value in the second array.
 * If there is none, the defaultValue is returned.
 */
function firstOn(values, onOff, defaultValue = 0) {
  return [...values, defaultValue][[...onOff, true].findIndex((e) => e)];
}

/**
 * Count number of the given value at the end of the given array
 * @param {*} arr
 * @param {*} value
 */
function countAtEnd(arr, value) {
  let res = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === value) {
      res++;
    } else {
      break;
    }
  }
  return res;
}

/**
 * Return an array with an item for each time the value shall change.
 * @param {*} onOff Array with on (true) and off (false) values.
 * @param {*} startTimes Array with start time for each onOff value.
 * @param {*} initial Optional. The initial value, to avoid the initial switch.
 * @returns Array with tuples: time and value
 */
function makeSchedule(onOff, startTimes, initial = null) {
  const res = [];
  let prev = initial;
  let prevRecord;
  for (let i = 0; i < startTimes.length; i++) {
    const value = onOff[i];
    if (value !== prev || i === 0) {
      const time = startTimes[i];
      prevRecord = { time, value, countHours: 0 };
      res.push(prevRecord);
      prev = value;
    }
    prevRecord.countHours++;
  }
  return res;
}

function fillArray(value, count) {
  if (value === undefined || count <= 0) {
    return [];
  }
  res = [];
  for (let i = 0; i < count; i++) {
    res.push(value);
  }
  return res;
}

function extractPlanForDate(plan, day) {
  const part = {};
  part.hours = plan.hours.filter((h) => isSameDate(day, h.start));
  part.schedule = plan.schedule.filter((s) => isSameDate(day, s.time));
  return part;
}

function isSameDate(date1, date2) {
  return DateTime.fromISO(date1).toISODate() === DateTime.fromISO(date2).toISODate();
}

function getStartAtIndex(effectiveConfig, priceData, time) {
  if (effectiveConfig.scheduleOnlyFromCurrentTime) {
    return priceData.map((p) => DateTime.fromISO(p.start)).filter((t) => t < time).length;
  } else {
    return 0;
  }
}

function validationFailure(node, message, status = null) {
  node.status({ fill: "red", shape: "ring", text: status ?? message });
  node.warn(message);
}

module.exports = {
  booleanConfig,
  countAtEnd,
  extractPlanForDate,
  fillArray,
  firstOn,
  getDiff,
  getDiffToNextOn,
  getEffectiveConfig,
  getSavings,
  getStartAtIndex,
  isSameDate,
  loadDayData,
  makeSchedule,
  roundPrice,
  sortedIndex,
  validationFailure,
};

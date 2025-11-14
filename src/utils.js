const { DateTime } = require("luxon");

function booleanConfig(value) {
  return value === "true" || value === true;
}

function calcNullSavings(values, _) {
  return values.map(() => null);
}

/**
 * Save the config object in the context, and set
 * all values directly on the node.
 *
 * @param {*} node
 * @param {*} originalConfig Object with config values
 */
function saveOriginalConfig(node, originalConfig) {
  node.context().set("config", originalConfig);
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
  res.hasChanged = false;
  const isConfigMsg = !!msg?.payload?.config;
  if (isConfigMsg) {
    const inputConfig = msg.payload.config;
    Object.keys(inputConfig).forEach((key) => {
      if (res[key] !== inputConfig[key]) {
        res[key] = inputConfig[key];
        res.hasChanged = true;
      }
    });
    node.context().set("config", res);
  }

  // Store config variables in node
  Object.keys(res).forEach((key) => (node[key] = res[key]));

  return res;
}

function loadDayData(node, date) {
  // Load saved schedule for the date (YYYY-MM-DD)
  // Return null if not found
  const key = date.toISODate();
  const saved = node.context().get(key);
  const res = saved ?? {
    schedule: [],
    minutes: [],
  };
  if(!res.minutes) {
    res.minutes = []
  }
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
function makeSchedule(onOff, startTimes, endTime, initial = null) {
  const res = [];
  let prev = initial;
  let prevRecord;
  for (let i = 0; i < startTimes.length; i++) {
    const value = onOff[i];
    if (value !== prev || i === 0) {
      const time = startTimes[i];
      prevRecord = { time, value, countMinutes: 0 };
      res.push(prevRecord);
      prev = value;
    }
    prevRecord.countMinutes = DateTime.fromISO(i + 1 < startTimes.length ? startTimes[i+1] : endTime).diff(DateTime.fromISO(prevRecord.time), "minutes").minutes;
  }
  return res;
}

function addEndToLast(priceData) {

  // Add end property to the last record, that is the same as start + the difference between the last two starts, converted to ISO time

  if (priceData.length > 0) {
    const lastStart = DateTime.fromISO(priceData[priceData.length - 1].start);
    const secondLastStart = DateTime.fromISO(priceData[priceData.length - 2].start);
    priceData[priceData.length - 1].end = lastStart
      .plus({ milliseconds: lastStart.diff(secondLastStart, "milliseconds").milliseconds })
      .toISO();
  }
}

function makeScheduleFromMinutes(minutes, initial = null) {

  addEndToLast(minutes)



  return makeSchedule(
    minutes.map((h) => h.onOff),
    minutes.map((h) => h.start),
    minutes[minutes.length - 1].end,
    initial
  );
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
  part.minutes = plan.minutes.filter((h) => isSameDate(day, h.start));
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

function msgHasPriceData(msg) {
  return !!msg?.payload?.priceData;
}

function msgHasConfig(msg) {
  return !!msg?.payload?.config;
}

function fixOutputValues(config) {
  if (config.outputValueForOntype === "bool") {
    config.outputValueForOn = booleanConfig(config.outputValueForOn);
  }
  if (config.outputValueForOntype === "num") {
    config.outputValueForOn = Number(config.outputValueForOn);
  }
  if (config.outputValueForOfftype === "bool") {
    config.outputValueForOff = booleanConfig(config.outputValueForOff);
  }
  if (config.outputValueForOfftype === "num") {
    config.outputValueForOff = Number(config.outputValueForOff);
  }
}

function fixPeriods(config) {
  config.periods.forEach((p) => {
    p.value = p.value === "true" || p.value === true;
  });
}

function getOutputForTime(schedule, time, defaultValue) {
  const pastSchedule = schedule.filter((entry) => DateTime.fromISO(entry.time) <= time);
  return pastSchedule.length ? pastSchedule[pastSchedule.length - 1].value : defaultValue;
}

module.exports = {
  addEndToLast,
  booleanConfig,
  calcNullSavings,
  countAtEnd,
  extractPlanForDate,
  fillArray,
  firstOn,
  fixOutputValues,
  fixPeriods,
  getDiff,
  getDiffToNextOn,
  getEffectiveConfig,
  getOutputForTime,
  getSavings,
  getStartAtIndex,
  isSameDate,
  loadDayData,
  makeSchedule,
  makeScheduleFromMinutes,
  msgHasConfig,
  msgHasPriceData,
  roundPrice,
  saveOriginalConfig,
  sortedIndex,
  validationFailure,
};

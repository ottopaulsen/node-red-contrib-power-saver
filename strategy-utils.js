const cloneDeep = require("lodash.clonedeep");
const { sortedIndex, TimeOfDay } = require("./utils");

function getBestContinuous(values, count) {
  let min = values.reduce((p, v) => p + v, 0);
  let minIndex = 0;
  for (let i = 0; i <= values.length - count; i++) {
    let sum = 0;
    for (let j = 0; j < count; j++) {
      sum += values[i + j];
    }
    if (sum < min) {
      min = sum;
      minIndex = i;
    }
  }
  const onOff = cloneDeep(values)
    .fill(false)
    .fill(true, minIndex, minIndex + count);
  return onOff;
}

function getBestX(values, count) {
  const sorted = sortedIndex(values);
  const onOff = cloneDeep(values).fill(true);
  for (let i = 0; i < sorted.length - count; i++) {
    onOff[sorted[i]] = false;
  }
  return onOff;
}

function getEffectiveConfig(node, msg) {
  const res = node.context().get("config");
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

function getTimeAfter(dateTime, timeOfDay) {
  // Get time for timeOfDay that is after datTime
  const tod = new TimeOfDay(timeOfDay);
  let timeAfter = cloneDeep(dateTime).set({ hours: tod.hours, minutes: tod.minutes });
  if (timeAfter <= dateTime) {
    timeAfter = timeAfter.plus({ days: 1 });
  }
  return timeAfter;
}

function getTimeBefore(dateTime, timeOfDay) {
  // Get time for timeOfDay that is before datTime
  const tod = new TimeOfDay(timeOfDay);
  let timeBefore = cloneDeep(dateTime).set({ hours: tod.hours, minutes: tod.minutes });
  if (timeBefore > dateTime) {
    timeBefore = timeBefore.plus({ days: -1 });
  }
  return timeBefore;
}

function isTimeInsidePeriod(dateTime, fromTime, toTime) {
  const from = new TimeOfDay(fromTime);
  const to = new TimeOfDay(toTime);
  const start = cloneDeep(dateTime).set({ hours: from.hours, minutes: from.minutes });
  let end = cloneDeep(dateTime).set({ hours: to.hours, minutes: to.minutes });
  if (end.toMillis() === start.toMillis()) {
    return true;
  }
  if (end < start) {
    end = end.plus({ days: 1 });
  }
  return dateTime >= start && dateTime < end;
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

function validateInput(node, msg) {
  if (!msg.payload) {
    validationFailure(node, "No payload");
    return;
  }
  if (typeof msg.payload !== "object") {
    validationFailure(node, "Payload is not an object");
    return;
  }
  if (msg.payload.config !== undefined) {
    return true; // Got config msg
  }
  if (msg.payload.priceData === undefined) {
    validationFailure(node, "Payload is missing priceData");
    return;
  }
  if (msg.payload.priceData.length === undefined) {
    validationFailure(node, "Illegal priceData in payload. Did you use the receive-price node?", "Illegal payload");
    return;
  }
  if (msg.payload.priceData.length === 0) {
    validationFailure(node, "priceData is empty");
    return;
  }
  msg.payload.priceData.forEach((h) => {
    if (!h.start || !h.value) {
      validationFailure(node, "Malformed entries in priceData. All entries must contain start and value.");
      return;
    }
  });
  return true;
}

function validationFailure(node, message, status = null) {
  node.status({ fill: "red", shape: "ring", text: status ?? message });
  node.warn(message);
}

module.exports = {
  getBestContinuous,
  getBestX,
  getEffectiveConfig,
  getTimeAfter,
  getTimeBefore,
  isTimeInsidePeriod,
  loadDayData,
  validateInput,
};

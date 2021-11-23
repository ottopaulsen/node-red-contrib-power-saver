const cloneDeep = require("lodash.clonedeep");
const { TimeOfDay } = require("./utils");

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

function getStartTimesInPeriod(fromTime, toTime, startTimes) {}

function isTimeInsidePeriod(dateTime, fromTime, toTime) {
  const from = new TimeOfDay(fromTime);
  const to = new TimeOfDay(toTime);
  const start = cloneDeep(dateTime).set({ hours: from.hours, minutes: from.minutes });
  let end = cloneDeep(dateTime).set({ hours: to.hours, minutes: to.minutes });
  if (end < dateTime || end.toMillis() === start.toMillis()) {
    end = end.plus({ days: 1 });
  }
  return dateTime >= start && dateTime < end;
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

module.exports = { getEffectiveConfig, getStartTimesInPeriod, isTimeInsidePeriod, validateInput };

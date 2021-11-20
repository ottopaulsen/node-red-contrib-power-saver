const { DateTime } = require("luxon");

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

function runSchedule(node, schedule, time) {
  let currentTime = time;
  let remainingSchedule = schedule.filter((entry) => {
    // console.log("entry.time:", entry.time);
    // console.log("curr. time:", time);
    return DateTime.fromISO(entry.time) > DateTime.fromISO(time);
  });
  // console.log("remainingSchedule", remainingSchedule);
  if (remainingSchedule.length > 0) {
    const entry = remainingSchedule[0];
    const nextTime = DateTime.fromISO(entry.time);
    const wait = nextTime - currentTime;
    const onOff = entry.value ? "on" : "off";
    node.log("Switching " + onOff + " in " + wait + " milliseconds");
    const statusMessage = `Scheduled ${remainingSchedule.length} changes. Next: ${
      remainingSchedule[0].value ? "on" : "off"
    }`;
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

function sendSwitch(node, onOff) {
  const output1 = onOff ? { payload: true } : null;
  const output2 = onOff ? null : { payload: false };
  node.send([output1, output2, null]);
}

function validationFailure(node, message, status = null) {
  node.status({ fill: "red", shape: "ring", text: status ?? message });
  node.warn(message);
}

module.exports = { getEffectiveConfig, runSchedule, validateInput };

const { validationFailure } = require("./utils");

function getPriceData(node, msg) {
  const isConfigMsg = !!msg?.payload?.config;
  if (isConfigMsg) {
    return node.context().get("lastPriceData");
  }

  if (!validateMsg(node, msg)) {
    return null;
  }
  const input = convertMsg(msg);
  if (!validateInput(node, input)) {
    return null;
  }

  priceData = [...input.today, ...input.tomorrow];
  priceData.source = input.source;
  node.context().set("lastPriceData", priceData);
  return priceData;
}

function validateMsg(node, msg) {
  if (!msg.payload && !msg.data?.new_state?.attributes) {
    validationFailure(node, "Payload missing");
    return false;
  }
  const payload = msg.data?.new_state?.attributes ?? msg.data?.attributes ?? msg.payload;
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
      validationFailure(node, `Malformed entries in payload.${arr}. All entries must contain start and value.`);
    }
  });
  if (!input.today.length && !input.tomorrow.length) {
    validationFailure(node, "Payload has no data");
    return false;
  }

  return true;
}

/**
 * Get today and tomorrow data out of the input message.
 * Can accept 3 types of messages: Tibber, Nordpool or plain payload with data already converted.
 * @param {*} msg
 */
function convertMsg(msg) {
  let today = [];
  let tomorrow = [];
  let source = "Unknown";

  if (msg.payload?.viewer?.homes[0]?.currentSubscription?.priceInfo?.today) {
    source = "Tibber";
    today = msg.payload.viewer.homes[0].currentSubscription.priceInfo.today.map((v) => ({
      value: v.total,
      start: v.startsAt,
    }));
  } else if (msg.data?.new_state?.attributes?.raw_today) {
    source = "Nordpool";
    today = msg.data.new_state.attributes.raw_today.map((v) => ({
      value: v.value,
      start: v.start,
    }));
  } else if (msg.payload?.attributes?.raw_today) {
    source = "Nordpool";
    today = msg.payload.attributes.raw_today.map((v) => ({
      value: v.value,
      start: v.start,
    }));
  } else {
    source = "Other";
    today = msg.payload?.today || [];
  }

  if (msg.payload?.viewer?.homes[0]?.currentSubscription?.priceInfo?.tomorrow) {
    tomorrow = msg.payload.viewer.homes[0].currentSubscription.priceInfo.tomorrow.map((v) => ({
      value: v.total,
      start: v.startsAt,
    }));
  } else if (msg.data?.new_state?.attributes?.raw_tomorrow) {
    tomorrow = msg.data.new_state.attributes.raw_tomorrow.map((v) => ({
      value: v.value,
      start: v.start,
    }));
  } else if (msg.payload?.attributes?.raw_tomorrow) {
    tomorrow = msg.payload.attributes.raw_tomorrow.map((v) => ({
      value: v.value,
      start: v.start,
    }));
  } else {
    tomorrow = msg.payload?.tomorrow || [];
  }

  return { today, tomorrow, source };
}

module.exports = {
  getPriceData,
  convertMsg,
};

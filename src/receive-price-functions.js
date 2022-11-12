const { validationFailure } = require("./utils");

function getPriceData(node, msg) {
  const isConfigMsg = !!msg?.payload?.config;
  if (isConfigMsg) {
    return node.context().get("lastPriceData");
  }

  const input = convertMsg(msg);
  if (!validateInput(node, input)) {
    return null;
  }

  priceData = [...input.today, ...input.tomorrow];
  const source = input.source;
  node.context().set("lastPriceData", priceData);
  const statusMsg = priceData.length + " hours from " + source;
  node.status({ fill: "green", shape: "ring", text: statusMsg });
  return { priceData, source };
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
  const result = { source: "Unknown" };

  ["today", "tomorrow"].forEach((day) => {
    if (msg.payload?.viewer?.home?.currentSubscription?.priceInfo[day]) {
      result.source = "Tibber";
      result[day] = msg.payload.viewer.home.currentSubscription.priceInfo[day].map((v) => ({
        value: v.total,
        start: v.startsAt,
      }));
    } else if (msg.payload?.viewer?.homes && msg.payload?.viewer?.homes[0]?.currentSubscription?.priceInfo[day]) {
      result.source = "Tibber";
      result[day] = msg.payload.viewer.homes[0].currentSubscription.priceInfo[day].map((v) => ({
        value: v.total,
        start: v.startsAt,
      }));
    } else if (msg.data?.new_state?.attributes["raw_" + day]) {
      result.source = "Nordpool";
      result[day] = msg.data.new_state.attributes["raw_" + day]
        .filter((v) => v.value !== undefined && v.value !== null)
        .map((v) => ({
          value: v.value,
          start: v.start,
        }));
    } else if (msg.data?.attributes && msg.data?.attributes["raw_" + day]) {
      result.source = "Nordpool";
      result[day] = msg.data.attributes["raw_" + day]
        .filter((v) => v.value !== undefined && v.value !== null)
        .map((v) => ({
          value: v.value,
          start: v.start,
        }));
    } else if (msg.payload?.attributes && msg.payload.attributes["raw_" + day]) {
      result.source = "Nordpool";
      result[day] = msg.payload.attributes["raw_" + day]
        .filter((v) => v.value !== undefined && v.value !== null)
        .map((v) => ({
          value: v.value,
          start: v.start,
        }));
    } else {
      result.source = "Other";
      result[day] = msg.payload[day] || [];
    }
  });

  return result;
}

module.exports = {
  getPriceData,
  convertMsg,
};

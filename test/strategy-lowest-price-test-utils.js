const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");

function makeFlow(minutesOn, maxPrice = null, doNotSplit = true, fromHour = "10", toHour = "20") {
  return [
    {
      id: "n1",
      type: "ps-strategy-lowest-price",
      name: "test name",
      fromHour,
      fromMinute: 0,
      toHour,
      toMinute: 0,
      minutesOn,
      maxPrice,
      doNotSplit,
      sendCurrentValueWhenRescheduling: true,
      outputIfNoSchedule: true,
      wires: [["n3"], ["n4"], ["n2"]],
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" },
    { id: "n4", type: "helper" },
  ];
}

function makePayload(prices, time) {
  const payload = cloneDeep(prices);
  payload.time = time;
  return payload;
}

module.exports = { makeFlow, makePayload };

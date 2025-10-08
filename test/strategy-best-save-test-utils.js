const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const { addEndToLast } = require("../src/utils");

function makeFlow(maxMinutesOff = 45, minMinutesOff = 15, recoveryPercentage = 50, recoveryMaxMinutes = 30) {
  return [
    {
      id: "n1",
      type: "ps-strategy-best-save",
      name: "test name",
      maxMinutesOff,
      minMinutesOff,
      recoveryPercentage,
      recoveryMaxMinutes,
      minSaving: 0.001,

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
  let entryTime = DateTime.fromISO(payload.time);
  payload.priceData.forEach((e) => {
    e.start = entryTime.toISO();
    // entryTime = entryTime.plus({ milliseconds: 10 });
    entryTime = entryTime.plus({ seconds: 60 });
  });
  addEndToLast(payload.priceData);
  return payload;
}

module.exports = { makeFlow, makePayload };

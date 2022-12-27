const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");

function makeFlow(maxHoursToSaveInSequence, minHoursOnAfterMaxSequenceSaved, sendCurrentValueWhenRescheduling = true) {
  return [
    {
      id: "n1",
      type: "ps-strategy-best-save",
      name: "test name",
      maxHoursToSaveInSequence,
      minHoursOnAfterMaxSequenceSaved,
      sendCurrentValueWhenRescheduling,
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
    entryTime = entryTime.plus({ milliseconds: 10 });
  });
  return payload;
}

module.exports = { makeFlow, makePayload };

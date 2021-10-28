const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");

const testPlan = {
  schedule: [
    { time: "2021-06-20T01:50:00.000+02:00", value: true },
    { time: "2021-06-20T01:50:00.020+02:00", value: false },
    { time: "2021-06-20T01:50:00.040+02:00", value: true },
    { time: "2021-06-20T01:50:00.050+02:00", value: false },
    { time: "2021-06-20T01:50:00.080+02:00", value: true },
    { time: "2021-06-20T01:50:00.100+02:00", value: false },
    { time: "2021-06-20T01:50:00.120+02:00", value: true },
    { time: "2021-06-20T01:50:00.130+02:00", value: false },
    { time: "2021-06-20T01:50:00.140+02:00", value: true },
    { time: "2021-06-20T01:50:00.150+02:00", value: false },
    { time: "2021-06-20T01:50:00.180+02:00", value: true },
  ],
  time: "2021-06-20T01:50:00+02:00",
};

function makeFlow(maxHoursToSaveInSequence, minHoursOnAfterMaxSequenceSaved) {
  return [
    {
      id: "n1",
      type: "power-saver",
      name: "test name",
      maxHoursToSaveInSequence,
      minHoursOnAfterMaxSequenceSaved,
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
  payload.today.forEach((e) => {
    e.start = entryTime.toISO();
    entryTime = entryTime.plus({ milliseconds: 10 });
    e.end = entryTime.toISO();
  });
  payload.tomorrow?.forEach((e) => {
    e.start = entryTime.toISO();
    entryTime = entryTime.plus({ milliseconds: 10 });
    e.end = entryTime.toISO();
  });
  return payload;
}

module.exports = {
  testPlan,
  makeFlow,
  makePayload,
};

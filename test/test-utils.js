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

function equalPlan(expected, actual) {
  let res = true;
  if (expected.schedule.length !== actual.schedule.length) {
    console.log(
      "Schedules have different lengths: Expected " + expected.schedule.length + ", got " + actual.schedule.length
    );
    res = false;
  }
  if (expected.hours.length !== actual.hours.length) {
    console.log("Hours have different lengths: Expected " + expected.hours.length + ", got " + actual.hours.length);
  }
  expected.schedule.forEach((s, i) => {
    ["time", "value"].forEach((key) => {
      if (s[key] != actual.schedule[i][key]) {
        console.log(
          "Different schedule values for " +
            key +
            " at index " +
            i +
            ": Expected " +
            s[key] +
            ", got " +
            actual.schedule[i][key]
        );
        res = false;
      }
    });
  });
  expected.hours.forEach((s, i) => {
    ["price", "onOff", "start", "saving"].forEach((key) => {
      if (s[key] != actual.hours[i][key]) {
        console.log(
          "Different hour values for " +
            key +
            " at index " +
            i +
            ": Expected " +
            s[key] +
            ", got " +
            actual.hours[i][key]
        );
        res = false;
      }
    });
  });

  ["maxHoursToSaveInSequence", "minHoursOnAfterMaxSequenceSaved", "minSaving", "outputIfNoSchedule"].forEach((key) => {
    if (expected.config[key] != actual.config[key]) {
      console.log(
        "Different config values for " + key + ": Expected " + expected.config[key] + ", got " + actual.config[key]
      );
      res = false;
    }
  });

  return res;
}

module.exports = {
  testPlan,
  makePayload,
  equalPlan,
};

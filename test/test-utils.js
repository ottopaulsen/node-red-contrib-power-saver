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

  if (!equalSchedule(expected.schedule, actual.schedule)) {
    res = false;
  }

  if (!equalHours(expected.hours, actual.hours)) {
    res = false;
  }

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

function equalSchedule(expected, actual) {
  let res = true;
  if (expected.length !== actual.length) {
    console.log("Schedules have different lengths: Expected " + expected.length + ", got " + actual.length);
    res = false;
  }

  expected.forEach((s, i) => {
    ["time", "value"].forEach((key) => {
      if (s[key] != actual[i][key]) {
        console.log(
          "Different schedule values for " + key + " at index " + i + ": Expected " + s[key] + ", got " + actual[i][key]
        );
        res = false;
      }
    });
  });
  return res;
}

function equalHours(expected, actual, properties = ["price", "onOff", "start", "saving"]) {
  let res = true;
  if (expected.length !== actual.length) {
    console.log("Hours have different lengths: Expected " + expected.hours.length + ", got " + actual.hours.length);
  }

  expected.forEach((s, i) => {
    properties.forEach((key) => {
      if (s[key] != actual[i][key]) {
        console.log(
          "Different hour values for " + key + " at index " + i + ": Expected " + s[key] + ", got " + actual[i][key]
        );
        res = false;
      }
    });
  });

  return res;
}

module.exports = {
  testPlan,
  makePayload,
  equalPlan,
  equalHours,
  equalSchedule,
};

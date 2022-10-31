const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("expect");
const {
  booleanConfig,
  sortedIndex,
  firstOn,
  getDiffToNextOn,
  getSavings,
  countAtEnd,
  makeSchedule,
  makeScheduleFromHours,
  fillArray,
  extractPlanForDate,
  isSameDate,
} = require("../src/utils");
const testResult = require("./data/best-save-result.json");

describe("utils", () => {
  it("can test boolean config", () => {
    expect(booleanConfig(true)).toBeTruthy();
    expect(booleanConfig(false)).toBeFalsy();
    expect(booleanConfig("true")).toBeTruthy();
    expect(booleanConfig("false")).toBeFalsy();
    expect(booleanConfig(undefined)).toBeFalsy();
  });
  it("can sortedIndex", () => {
    expect(sortedIndex([3, 1, 2, 4])).toEqual([3, 0, 2, 1]);
  });
  it("returns the first on", () => {
    expect(firstOn([1, 2, 3], [false, false, false], 0)).toEqual(0);
    expect(firstOn([1, 2, 3], [true, false, false], 0)).toEqual(1);
    expect(firstOn([1, 2, 3], [false, true, false], 0)).toEqual(2);
    expect(firstOn([1, 2, 3], [false, false, true], 0)).toEqual(3);
    expect(firstOn([1, 2, 3], [true, true, true], 0)).toEqual(1);
    expect(firstOn([], [], 0)).toEqual(0);
  });
  it("can getDiffToNextOn", () => {
    const values = [100, 200, 30];
    expect(getDiffToNextOn(values, [false, false, false], 50)).toEqual([50, 150, -20]);
    expect(getDiffToNextOn(values, [false, false, true], 50)).toEqual([70, 170, -20]);
    expect(getDiffToNextOn(values, [false, true, false], 50)).toEqual([-100, 150, -20]);
    expect(getDiffToNextOn(values, [true, false, true], 50)).toEqual([70, 170, -20]);
    expect(getDiffToNextOn(values, [true, true, false], 50)).toEqual([-100, 150, -20]);
    expect(getDiffToNextOn(values, [true, true, false])).toEqual([-100, 170, 0]);
  });
  it("calculates savings for hours off", () => {
    const values = [1, 10, 8, 5];
    expect(getSavings(values, [true, true, true, true], 99)).toEqual([null, null, null, null]);
    expect(getSavings(values, [false, false, false, false], 99)).toEqual([-98, -89, -91, -94]);
    expect(getSavings(values, [false, true, false, true], 99)).toEqual([-9, null, 3, null]);
  });

  it("can count at end of array", () => {
    expect(countAtEnd([], true)).toEqual(0);
    expect(countAtEnd([true], true)).toEqual(1);
    expect(countAtEnd([false], true)).toEqual(0);
    expect(countAtEnd([true], false)).toEqual(0);
    expect(countAtEnd([true, true], false)).toEqual(0);
    expect(countAtEnd([true, false], false)).toEqual(1);
    expect(countAtEnd([false, true], false)).toEqual(0);
    expect(countAtEnd([false, true], undefined)).toEqual(0);
    expect(countAtEnd([true, false], undefined)).toEqual(0);
  });

  it("can make schedule", () => {
    const onOff = [false, false, true, true, false];
    const startTimes = [
      "2021-06-20T05:00:00+02:00",
      "2021-06-20T06:00:00+02:00",
      "2021-06-20T07:00:00+02:00",
      "2021-06-20T08:00:00+02:00",
      "2021-06-20T09:00:00+02:00",
    ];
    expect(makeSchedule(onOff, startTimes)).toEqual([
      { time: "2021-06-20T05:00:00+02:00", value: false, countHours: 2 },
      { time: "2021-06-20T07:00:00+02:00", value: true, countHours: 2 },
      { time: "2021-06-20T09:00:00+02:00", value: false, countHours: 1 },
    ]);
    expect(makeSchedule(onOff, startTimes, true)).toEqual([
      { time: "2021-06-20T05:00:00+02:00", value: false, countHours: 2 },
      { time: "2021-06-20T07:00:00+02:00", value: true, countHours: 2 },
      { time: "2021-06-20T09:00:00+02:00", value: false, countHours: 1 },
    ]);
    expect(makeSchedule(onOff, startTimes, false)).toEqual([
      { time: "2021-06-20T05:00:00+02:00", value: false, countHours: 2 }, // Right???
      { time: "2021-06-20T07:00:00+02:00", value: true, countHours: 2 },
      { time: "2021-06-20T09:00:00+02:00", value: false, countHours: 1 },
    ]);
  });

  it("can fill an array", () => {
    expect(fillArray(false, 0)).toEqual([]);
    expect(fillArray(false, 2)).toEqual([false, false]);
    expect(fillArray(true, 2)).toEqual([true, true]);
    expect(fillArray(undefined, 2)).toEqual([]);
    expect(fillArray(true, 0)).toEqual([]);
  });

  it("can compare dates", () => {
    const date1 = "2021-06-20T01:50:00.000+02:00";
    expect(isSameDate(date1, "2021-06-20T01:50:00.000+02:00")).toBeTruthy();
    expect(isSameDate(date1, "2021-06-21T01:50:00.000+02:00")).toBeFalsy();
    expect(isSameDate(date1, "2021-06-20")).toBeTruthy();
    expect(isSameDate(date1, "2021-06-21")).toBeFalsy();
  });

  it("can extract plan for a date", () => {
    const plan = {
      hours: [
        {
          price: 0.3,
          onOff: true,
          start: "2021-06-20T01:50:00.000+02:00",
          saving: 1,
        },
        {
          price: 0.4,
          onOff: false,
          start: "2021-06-20T01:50:00.010+02:00",
          saving: 2,
        },
        {
          price: 0.2,
          onOff: false,
          start: "2021-06-21T01:50:00.180+02:00",
          saving: 3,
        },
        {
          price: 0.85,
          onOff: true,
          start: "2021-06-21T01:50:00.190+02:00",
          saving: null,
        },
      ],
      schedule: [
        {
          time: "2021-06-20T01:50:00.000+02:00",
          value: true,
        },
        {
          time: "2021-06-21T01:50:00.020+02:00",
          value: false,
        },
        {
          time: "2021-06-21T01:50:00.040+02:00",
          value: false,
        },
      ],
    };
    const part1 = {
      hours: [
        {
          price: 0.3,
          onOff: true,
          start: "2021-06-20T01:50:00.000+02:00",
          saving: 1,
        },
        {
          price: 0.4,
          onOff: false,
          start: "2021-06-20T01:50:00.010+02:00",
          saving: 2,
        },
      ],
      schedule: [
        {
          time: "2021-06-20T01:50:00.000+02:00",
          value: true,
        },
      ],
    };
    const part2 = {
      hours: [
        {
          price: 0.2,
          onOff: false,
          start: "2021-06-21T01:50:00.180+02:00",
          saving: 3,
        },
        {
          price: 0.85,
          onOff: true,
          start: "2021-06-21T01:50:00.190+02:00",
          saving: null,
        },
      ],
      schedule: [
        {
          time: "2021-06-21T01:50:00.020+02:00",
          value: false,
        },
        {
          time: "2021-06-21T01:50:00.040+02:00",
          value: false,
        },
      ],
    };
    expect(extractPlanForDate(plan, "2021-06-20T01:50:00.000+02:00")).toEqual(part1);
  });
  it("Can make schedule from hours", () => {
    const hours = cloneDeep(testResult.hours);
    const schedule = makeScheduleFromHours(hours, null);
    const resultToValidate = schedule.map((s) => ({ time: s.time, value: s.value }));
    resultToValidate.push({
      time: "2021-06-20T02:50:00.470+02:00",
      value: false,
    });
    expect(resultToValidate).toEqual(testResult.schedule);
  });
});

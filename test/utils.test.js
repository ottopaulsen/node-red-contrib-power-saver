const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("chai").expect;

const {
  booleanConfig,
  sortedIndex,
  firstOn,
  getDiffToNextOn,
  getSavings,
  countAtEnd,
  makeSchedule,
  makeScheduleFromMinutes,
  fillArray,
  extractPlanForDate,
  isSameDate,
} = require("../src/utils");
const testResult = require("./data/schedule-from-minutes-test-data.json");

describe("utils", () => {
  it("can test boolean config", () => {
    expect(booleanConfig(true)).to.equal(true);
    expect(booleanConfig(false)).to.equal(false);
    expect(booleanConfig("true")).to.equal(true);
    expect(booleanConfig("false")).to.equal(false);
    expect(booleanConfig(undefined)).to.equal(false);
  });
  it("can sortedIndex", () => {
    expect(sortedIndex([3, 1, 2, 4])).to.eql([3, 0, 2, 1]);
  });
  it("returns the first on", () => {
    expect(firstOn([1, 2, 3], [false, false, false], 0)).to.equal(0);
    expect(firstOn([1, 2, 3], [true, false, false], 0)).to.equal(1);
    expect(firstOn([1, 2, 3], [false, true, false], 0)).to.equal(2);
    expect(firstOn([1, 2, 3], [false, false, true], 0)).to.equal(3);
    expect(firstOn([1, 2, 3], [true, true, true], 0)).to.equal(1);
    expect(firstOn([], [], 0)).to.equal(0);
  });
  it("can getDiffToNextOn", () => {
    const values = [100, 200, 30];
    expect(getDiffToNextOn(values, [false, false, false], 50)).to.eql([50, 150, -20]);
    expect(getDiffToNextOn(values, [false, false, true], 50)).to.eql([70, 170, -20]);
    expect(getDiffToNextOn(values, [false, true, false], 50)).to.eql([-100, 150, -20]);
    expect(getDiffToNextOn(values, [true, false, true], 50)).to.eql([70, 170, -20]);
    expect(getDiffToNextOn(values, [true, true, false], 50)).to.eql([-100, 150, -20]);
    expect(getDiffToNextOn(values, [true, true, false])).to.eql([-100, 170, 0]);
  });
  it("calculates savings for minutes off", () => {
    const values = [1, 10, 8, 5];
    expect(getSavings(values, [true, true, true, true], 99)).to.eql([null, null, null, null]);
    expect(getSavings(values, [false, false, false, false], 99)).to.eql([-98, -89, -91, -94]);
    expect(getSavings(values, [false, true, false, true], 99)).to.eql([-9, null, 3, null]);
  });

  it("can count at end of array", () => {
    expect(countAtEnd([], true)).to.equal(0);
    expect(countAtEnd([true], true)).to.equal(1);
    expect(countAtEnd([false], true)).to.equal(0);
    expect(countAtEnd([true], false)).to.equal(0);
    expect(countAtEnd([true, true], false)).to.equal(0);
    expect(countAtEnd([true, false], false)).to.equal(1);
    expect(countAtEnd([false, true], false)).to.equal(0);
    expect(countAtEnd([false, true], undefined)).to.equal(0);
    expect(countAtEnd([true, false], undefined)).to.equal(0);
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
    const endTime = "2021-06-20T10:00:00+02:00";
    expect(makeSchedule(onOff, startTimes, endTime)).to.eql([
      { time: "2021-06-20T05:00:00+02:00", value: false, countMinutes: 120 },
      { time: "2021-06-20T07:00:00+02:00", value: true, countMinutes: 120 },
      { time: "2021-06-20T09:00:00+02:00", value: false, countMinutes: 60 },
    ]);
    expect(makeSchedule(onOff, startTimes, endTime, true)).to.eql([
      { time: "2021-06-20T05:00:00+02:00", value: false, countMinutes: 120 },
      { time: "2021-06-20T07:00:00+02:00", value: true, countMinutes: 120 },
      { time: "2021-06-20T09:00:00+02:00", value: false, countMinutes: 60 },
    ]);
    expect(makeSchedule(onOff, startTimes, endTime, false)).to.eql([
      { time: "2021-06-20T05:00:00+02:00", value: false, countMinutes: 120 }, // Right???
      { time: "2021-06-20T07:00:00+02:00", value: true, countMinutes: 120 },
      { time: "2021-06-20T09:00:00+02:00", value: false, countMinutes: 60 },
    ]);
  });

  it("can fill an array", () => {
    expect(fillArray(false, 0)).to.eql([]);
    expect(fillArray(false, 2)).to.eql([false, false]);
    expect(fillArray(true, 2)).to.eql([true, true]);
    expect(fillArray(undefined, 2)).to.eql([]);
    expect(fillArray(true, 0)).to.eql([]);
  });

  it("can compare dates", () => {
    const date1 = "2021-06-20T01:50:00.000+02:00";
    expect(isSameDate(date1, "2021-06-20T01:50:00.000+02:00")).to.equal(true);
    expect(isSameDate(date1, "2021-06-21T01:50:00.000+02:00")).to.equal(false);
    expect(isSameDate(date1, "2021-06-20")).to.equal(true);
    expect(isSameDate(date1, "2021-06-21")).to.equal(false);
  });

  it("can extract plan for a date", () => {
    const plan = {
      minutes: [
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
      minutes: [
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
      minutes: [
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
    expect(extractPlanForDate(plan, "2021-06-20T01:50:00.000+02:00")).to.eql(part1);
  });
  it("Can make schedule from minutes", () => {
    const minutes = cloneDeep(testResult.minutes);
    const schedule = makeScheduleFromMinutes(minutes, null);
    expect(schedule).to.eql(testResult.schedule);
  });
});

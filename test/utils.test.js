const expect = require("expect");
const {
  sortedIndex,
  firstOn,
  getDiffToNextOn,
  isOnOffSequencesOk,
  getSavings,
  countAtEnd,
  makeSchedule,
  fillArray,
  convertMsg,
} = require("../utils");

describe("utils", () => {
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
    expect(getDiffToNextOn(values, [false, false, false], 50)).toEqual([
      50, 150, -20,
    ]);
    expect(getDiffToNextOn(values, [false, false, true], 50)).toEqual([
      70, 170, -20,
    ]);
    expect(getDiffToNextOn(values, [false, true, false], 50)).toEqual([
      -100, 150, -20,
    ]);
    expect(getDiffToNextOn(values, [true, false, true], 50)).toEqual([
      70, 170, -20,
    ]);
    expect(getDiffToNextOn(values, [true, true, false], 50)).toEqual([
      -100, 150, -20,
    ]);
    expect(getDiffToNextOn(values, [true, true, false])).toEqual([
      -100, 170, 0,
    ]);
  });
  it("evaluates onOff sequences correct", () => {
    expect(isOnOffSequencesOk([], 0, 0)).toBeTruthy();
    expect(isOnOffSequencesOk([true], 0, 0)).toBeTruthy();
    expect(isOnOffSequencesOk([false], 0, 0)).toBeFalsy();
    expect(isOnOffSequencesOk([true, false], 0, 0)).toBeFalsy();
    expect(isOnOffSequencesOk([true, false], 1, 0)).toBeTruthy();
    const onOff = [true, true, false, false, false, true, true, false];
    expect(isOnOffSequencesOk(onOff, 3, 2)).toBeTruthy();
    expect(isOnOffSequencesOk(onOff, 4, 2)).toBeTruthy();
    expect(isOnOffSequencesOk(onOff, 2, 2)).toBeFalsy();
    expect(isOnOffSequencesOk(onOff, 3, 3)).toBeFalsy();
  });
  it("calculates savings for hours off", () => {
    const values = [1, 10, 8, 5];
    expect(getSavings(values, [true, true, true, true], 99)).toEqual([
      null,
      null,
      null,
      null,
    ]);
    expect(getSavings(values, [false, false, false, false], 99)).toEqual([
      -98, -89, -91, -94,
    ]);
    expect(getSavings(values, [false, true, false, true], 99)).toEqual([
      -9,
      null,
      3,
      null,
    ]);
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
      { time: "2021-06-20T05:00:00+02:00", value: false },
      { time: "2021-06-20T07:00:00+02:00", value: true },
      { time: "2021-06-20T09:00:00+02:00", value: false },
    ]);
    expect(makeSchedule(onOff, startTimes, true)).toEqual([
      { time: "2021-06-20T05:00:00+02:00", value: false },
      { time: "2021-06-20T07:00:00+02:00", value: true },
      { time: "2021-06-20T09:00:00+02:00", value: false },
    ]);
    expect(makeSchedule(onOff, startTimes, false)).toEqual([
      { time: "2021-06-20T07:00:00+02:00", value: true },
      { time: "2021-06-20T09:00:00+02:00", value: false },
    ]);
  });

  it("can fill an array", () => {
    expect(fillArray(false, 0)).toEqual([]);
    expect(fillArray(false, 2)).toEqual([false, false]);
    expect(fillArray(true, 2)).toEqual([true, true]);
    expect(fillArray(undefined, 2)).toEqual([]);
    expect(fillArray(true, 0)).toEqual([]);
  });

  it("can convert input msg", () => {
    const msgStd = {
      payload: {
        today: [
          { value: 1, start: "2021-06-21T00:00:00+02:00" },
          { value: 2, start: "2021-06-21T01:00:00+02:00" },
        ],
        tomorrow: [
          { value: 3, start: "2021-06-22T00:00:00+02:00" },
          { value: 4, start: "2021-06-22T01:00:00+02:00" },
        ],
      },
    };
    const msgStdTodayOnly = {
      payload: {
        today: [
          { value: 1, start: "2021-06-21T00:00:00+02:00" },
          { value: 2, start: "2021-06-21T01:00:00+02:00" },
        ],
        tomorrow: [],
      },
    };
    const msgNordpool = {
      data: {
        new_state: {
          attributes: {
            raw_today: [
              { value: 1, start: "2021-06-21T00:00:00+02:00" },
              { value: 2, start: "2021-06-21T01:00:00+02:00" },
            ],
            raw_tomorrow: [
              { value: 3, start: "2021-06-22T00:00:00+02:00" },
              { value: 4, start: "2021-06-22T01:00:00+02:00" },
            ],
          },
        },
      },
    };
    const msgTibber = {
      payload: {
        viewer: {
          homes: [
            {
              currentSubscription: {
                priceInfo: {
                  current: {
                    total: 0.6411,
                    energy: 0.505,
                    tax: 0.1361,
                    startsAt: "2021-06-21T00:00:00+02:00",
                  },
                  today: [
                    {
                      total: 1,
                      energy: 0.5051,
                      tax: 0.1361,
                      startsAt: "2021-06-21T00:00:00+02:00",
                    },
                    {
                      total: 2,
                      energy: 0.5016,
                      tax: 0.1353,
                      startsAt: "2021-06-21T01:00:00+02:00",
                    },
                  ],
                  tomorrow: [
                    {
                      total: 3,
                      energy: 0.4521,
                      tax: 0.1229,
                      startsAt: "2021-06-22T00:00:00+02:00",
                    },
                    {
                      total: 4,
                      energy: 0.4488,
                      tax: 0.1221,
                      startsAt: "2021-06-22T01:00:00+02:00",
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    };

    expect(convertMsg(msgStd)).toEqual({ source: "Other", ...msgStd.payload });
    expect(convertMsg(msgTibber)).toEqual({
      source: "Tibber",
      ...msgStd.payload,
    });
    expect(convertMsg(msgNordpool)).toEqual({
      source: "Nordpool",
      ...msgStd.payload,
    });
    delete msgTibber.payload.viewer.homes[0].currentSubscription.priceInfo
      .tomorrow;
    expect(convertMsg(msgTibber)).toEqual({
      source: "Tibber",
      ...msgStdTodayOnly.payload,
    });
    delete msgNordpool.data.new_state.attributes.raw_tomorrow;
    expect(convertMsg(msgNordpool)).toEqual({
      source: "Nordpool",
      ...msgStdTodayOnly.payload,
    });
    expect(convertMsg(msgStdTodayOnly)).toEqual({
      source: "Other",
      ...msgStdTodayOnly.payload,
    });
  });
});

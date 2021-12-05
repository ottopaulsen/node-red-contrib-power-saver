const { DateTime } = require("luxon");
const expect = require("expect");
const { getBestContinuous, getBestX, getTimeAfter, getTimeBefore, isTimeInsidePeriod } = require("../strategy-utils");
const convertedPrices = require("./data/converted-prices.json");
const { cloneDeep } = require("lodash");

describe("strategy-utils", () => {
  it("can get time after and before", () => {
    const opts = {
      suppressMilliseconds: true,
      suppressSeconds: true.valueOf,
      includeOffset: false,
    };
    const now = DateTime.local(2021, 11, 22, 20, 26);
    expect(getTimeBefore(now, "12").toISO(opts)).toEqual("2021-11-22T12:00");
    expect(getTimeBefore(now, "20").toISO(opts)).toEqual("2021-11-22T20:00");
    expect(getTimeAfter(now, "12").toISO(opts)).toEqual("2021-11-23T12:00");
    expect(getTimeAfter(now, "20").toISO(opts)).toEqual("2021-11-23T20:00");
  });

  it("can check isTimeInsidePeriod", () => {
    const now = DateTime.local(2021, 11, 22, 20, 26);
    expect(isTimeInsidePeriod(now, "00", "23")).toBeTruthy();
    expect(isTimeInsidePeriod(now, "00", "00")).toBeTruthy();
    expect(isTimeInsidePeriod(now, "20", "20")).toBeTruthy();
    expect(isTimeInsidePeriod(now, "10", "19")).toBeFalsy();
    expect(isTimeInsidePeriod(now, "21", "19")).toBeFalsy();
  });

  it("can find best x", () => {
    const values = convertedPrices.priceData.slice(0, 48).map((p) => p.value);
    const result = cloneDeep(values).fill(false);
    result.fill(true, 0, 6);
    result.fill(true, 24, 31);
    expect(getBestX(values, 13)).toEqual(result);
    const values1 = convertedPrices.priceData.slice(0, 12).map((p) => p.value);
    const result1 = cloneDeep(values1).fill(false);
    expect(getBestX(values1, 1)).toEqual(cloneDeep(result1).fill(true, 2, 3));
    expect(getBestX(values1, 3)).toEqual(cloneDeep(result1).fill(true, 1, 4));
    const values2 = convertedPrices.priceData.slice(24, 28).map((p) => p.value);
    const result2 = cloneDeep(values2).fill(false);
    expect(getBestX(values2, 1)).toEqual(cloneDeep(result2).fill(true, 3, 4));
    expect(getBestX(values2, 3)).toEqual(cloneDeep(result2).fill(true, 1, 4));
  });

  it("can find best x continuous", () => {
    const values = convertedPrices.priceData.slice(0, 12).map((p) => p.value);
    const result = cloneDeep(values).fill(false);
    expect(getBestContinuous(values, 1)).toEqual(cloneDeep(result).fill(true, 2, 3));
    expect(getBestContinuous(values, 3)).toEqual(cloneDeep(result).fill(true, 1, 4));
    const values2 = convertedPrices.priceData.slice(24, 28).map((p) => p.value);
    const result2 = cloneDeep(values2).fill(false);
    expect(getBestContinuous(values2, 1)).toEqual(cloneDeep(result2).fill(true, 3, 4));
    expect(getBestContinuous(values2, 3)).toEqual(cloneDeep(result2).fill(true, 1, 4));
  });
});

function validatePeriod(period, start, end, count) {
  expect(period.length).toEqual(count);
  expect(period[0]).toEqual(start);
  expect(period[count - 1]).toEqual(end);
}

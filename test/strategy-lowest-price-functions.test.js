const { DateTime } = require("luxon");
const expect = require("expect");
const { getBestContinuous, getBestX } = require("../src/strategy-lowest-price-functions");
const convertedPrices = require("./data/converted-prices.json");
const cloneDeep = require("lodash.clonedeep");

describe("strategy-lowest-price-functions", () => {
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

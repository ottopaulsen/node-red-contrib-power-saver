"use strict";
const { DateTime } = require("luxon");
const expect = require("chai").expect;
const {
  calculateSchedule,
  calculateOpportunities,
  findBestBuySellPattern,
  calculateValueDictList,
  removeLowBuySellPairs,
} = require("../src/strategy-heat-capacitor-functions");
const converted_prices = require("./data/converted-prices.json");
const decreasing_end_prices = require("./data/tibber-decreasing2-24h.json");

function buildMinutePriceVectorForTests(priceData) {
  if (!Array.isArray(priceData) || priceData.length === 0) {
    return { minutePrices: [], startDate: null };
  }

  const sorted = priceData
    .slice()
    .sort((a, b) => DateTime.fromISO(a.start).toMillis() - DateTime.fromISO(b.start).toMillis());

  const minutePrices = [];
  let previousIntervalMinutes = 60;

  for (let i = 0; i < sorted.length; i++) {
    const currentStart = DateTime.fromISO(sorted[i].start);
    let intervalMinutes = previousIntervalMinutes;

    if (sorted[i + 1]) {
      intervalMinutes = DateTime.fromISO(sorted[i + 1].start).diff(currentStart, "minutes").minutes;
    } else if (sorted[i].end) {
      intervalMinutes = DateTime.fromISO(sorted[i].end).diff(currentStart, "minutes").minutes;
    }

    intervalMinutes = Math.max(1, Math.round(intervalMinutes));
    previousIntervalMinutes = intervalMinutes;

    for (let m = 0; m < intervalMinutes; m++) {
      minutePrices.push(sorted[i].value);
    }
  }

  return { minutePrices, startDate: DateTime.fromISO(sorted[0].start) };
}

function buildMinutePricesFromValues(values, startIso) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }
  const baseDate = startIso ? DateTime.fromISO(startIso) : DateTime.fromISO(converted_prices.priceData[0].start);
  const priceData = values.map((value, idx) => ({
    value,
    start: baseDate.plus({ hours: idx }).toISO(),
  }));
  return buildMinutePriceVectorForTests(priceData).minutePrices;
}

describe("ps-strategy-heat-capacitor-functions", () => {
  let prices, decreasing_24h_prices, start_date, buy_pattern, sell_pattern;

  //User input
  const timeHeat1C = 60;
  const timeCool1C = 40;
  const setpoint = 23;
  const maxTempAdjustment = 1;
  const boostTempHeat = 1;
  const boostTempCool = 1;
  const minSavings = 0.1;

  before(function () {
    const convertedSingleHour = buildMinutePriceVectorForTests(converted_prices.priceData.slice(0, 1));
    prices = convertedSingleHour.minutePrices;
    decreasing_24h_prices = buildMinutePriceVectorForTests(decreasing_end_prices.priceData).minutePrices;
    start_date = convertedSingleHour.startDate;
    buy_pattern = Array(Math.round(timeHeat1C * maxTempAdjustment * 2)).fill(1);
    sell_pattern = Array(Math.round(timeCool1C * maxTempAdjustment * 2)).fill(1);
  });

  it("Can calculate procurement opportunities", () => {
    const my_prices = prices.slice();
    const my_buy_pattern = Array(5).fill(1);
    //Calculate what it will cost to procure/sell 1 kWh as a function of time
    let result = calculateOpportunities(my_prices, my_buy_pattern, 1);
    //Remove float precisions errors by rounding
    result = result.map((x) => Math.round(x * 1000000) / 1000000);
    expect(result).to.eql(Array(56).fill(my_prices[0]));
  });

  it("Can find procurement pattern", () => {
    //Use a simple price list
    const my_prices = buildMinutePricesFromValues([1, 2, 2, 1, 8, 1], start_date.toISO());

    const buy_prices = calculateOpportunities(my_prices, buy_pattern, 1);
    const sell_prices = calculateOpportunities(my_prices, sell_pattern, 1);

    const my_buy_sell = findBestBuySellPattern(buy_prices, buy_pattern.length, sell_prices, sell_pattern.length);

    expect(my_buy_sell).to.eql([
      [0, 141],
      [100, 240],
    ]);
  });

  it("DictList test", () => {
    const my_prices = buildMinutePricesFromValues([1, 2, 2, 1, 8, 1], start_date.toISO());
    const my_buy_sell_indexes = [
      [0, 173],
      [131, 251],
    ];
    const buy_prices = calculateOpportunities(my_prices, buy_pattern, 1);
    const sell_prices = calculateOpportunities(my_prices, sell_pattern, 1);
    const result = calculateValueDictList(my_buy_sell_indexes, buy_prices, sell_prices, start_date);

    expect(result[0].sellDate).to.eql(start_date.plus({ minutes: 131 }));
  });

  it("DictList test at decreasing end", () => {
    const my_prices = decreasing_24h_prices;
    const buy_prices = calculateOpportunities(my_prices, buy_pattern, 1);
    const sell_prices = calculateOpportunities(my_prices, sell_pattern, 1);

    const my_buy_sell = findBestBuySellPattern(buy_prices, buy_pattern.length, sell_prices, sell_pattern.length);
    const my_schedule = calculateSchedule(
      start_date,
      my_buy_sell,
      buy_prices,
      sell_prices,
      setpoint,
      maxTempAdjustment,
      boostTempHeat,
      boostTempCool,
      buy_pattern.length,
      sell_pattern.length
    );
    expect(my_schedule.temperatures[my_schedule.temperatures.length - 1]).to.equal(-maxTempAdjustment);
  });

  it("Check removal of low benefit buy-sell pairs", () => {
    const my_prices = buildMinutePricesFromValues([1, 2, 1, 1.05, 1, 2], start_date.toISO());
    const buy_prices = calculateOpportunities(my_prices, buy_pattern, 1);
    const sell_prices = calculateOpportunities(my_prices, sell_pattern, 1);
    const my_buy_sell = findBestBuySellPattern(buy_prices, buy_pattern.length, sell_prices, sell_pattern.length);

    const result = removeLowBuySellPairs(my_buy_sell, buy_prices, sell_prices, minSavings, start_date);
    //Should remove the sell at 1.05 and the re-buy at 1 (only 0.05 difference)
    const compare = [my_buy_sell[0].slice(0, 2), [my_buy_sell[1][0], my_buy_sell[1][2]]];

    expect(result).to.eql(compare);
  });
});

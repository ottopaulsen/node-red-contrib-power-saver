"use strict";
const { DateTime } = require("luxon");

function calculateOpportunities(prices, pattern, amount) {
  //creating a price vector with minute granularity
  const tempPrice = Array(prices.length * 60).fill(0);
  for (let i = 0; i < prices.length; i++) {
    tempPrice.fill(prices[i], i * 60, (i + 1) * 60);
    //debugger;
  }

  //Calculate weighted pattern
  const  weight = amount / pattern.reduce((a, b) => a + b, 0); //last calculates the sum of all numbers in the pattern
  const  weightedPattern = pattern.map((x) => x * weight);

  //Calculating procurement opportunities. Sliding the pattern over the price vector to find the price for procuring
  //at time t
  const dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
  const  procurementOpportunities = Array(prices.length * 60 - pattern.length + 1);
  for (let i = 0; i < procurementOpportunities.length; i++) {
    procurementOpportunities[i] = dot(weightedPattern, tempPrice.slice(i, i + pattern.length));
  }
  return procurementOpportunities;
}

// This function finds the buy sell
// schedule for maximum profit
// two vectors containing the buy and sell indexes are returned in an array
function findBestBuySellPattern(priceBuy, buyLength, priceSell, sellLength) {
  // Traverse through given price array
  const  buyIndexes = [];
  const  sellIndexes = [];
  let i = 0;
  while (i < priceBuy.length - 1) {
    // Find Local Minima
    // Note that the limit is (n-2) as we are
    // comparing present element to the next element
    while (i < priceBuy.length - 1 && priceBuy[i + 1] < priceBuy[i]) i++;

    // If we reached the end, break
    // as no further solution possible
    if (i == priceBuy.length - 1) break;

    // Store the index of minima
    buyIndexes.push(i);
    // Move the next allowed maxima away from the minima - required due to the asymmetric buy/sell prices
    i = i + Math.round(buyLength / 2);
    // Find Local Maxima
    // Note that the limit is (n-1) as we are
    // comparing to previous element
    while (i < priceSell.length && priceSell[i] >= priceSell[i - 1]) i++;

    // Store the index of maxima
    sellIndexes.push(i - 1);
    i = i + Math.round(sellLength / 2);
  }
  return [buyIndexes, sellIndexes];
}

function calculateValueDictlist(buySell, buyPrices, sellPrices, startDate) {
  const  buySellValueDictList = [];
  for (let i = 0; i < buySell[0].length; i++) {
    const buyDatetime = startDate.plus({ minutes: buySell[0][i] });
    const sellDatetime = startDate.plus({ minutes: buySell[1][i] });
    if (i != 0) {
      const prevSellDatetime = startDate.plus({ minutes: buySell[1][i - 1] });
      buySellValueDictList.push({
        type: "sell - buy",
        value: sellPrices[buySell[1][i - 1]] - buyPrices[buySell[0][i]],
        buy: buySell[0][i],
        buyDate: buyDatetime,
        sell: buySell[1][i - 1],
        sellDate: prevSellDatetime,
      });
    }
    buySellValueDictList.push({
      type: "buy - sell",
      value: sellPrices[buySell[1][i]] - buyPrices[buySell[0][i]],
      buy: buySell[0][i],
      buyDate: buyDatetime,
      sell: buySell[1][i],
      sellDate: sellDatetime,
    });
  }
  return buySellValueDictList;
}

function removeLowBuySellPairs(buySellPattern, buyPrices, sellPrices, minSavings, startDate) {
  let lowestSaving = -1;
  const buySellClone = Array.from(buySellPattern);

  while (minSavings >= lowestSaving) {
    const dictlist = calculateValueDictlist(buySellClone, buyPrices, sellPrices, startDate);
    if (dictlist.length === 0) {
      return buySellClone;
    }
    let sellIndex = 0;
    let buyIndex = 0;
    for (let i = 0; i < dictlist.length; i++) {
      if (i == 0 || dictlist[i].value < lowestSaving) {
        lowestSaving = dictlist[i].value;
        sellIndex = dictlist[i].sell;
        buyIndex = dictlist[i].buy;
      }
    }
    if (lowestSaving <= minSavings) {
      buySellClone[0] = buySellClone[0].filter((x) => x != buyIndex);
      buySellClone[1] = buySellClone[1].filter((x) => x != sellIndex);
    }
  }
  return buySellClone;
}

function calculateSchedule(startDate, buySellStackedArray, buyPrices, sellPrices, maxTempAdjustment) {
  const arrayLength = buyPrices.length;
  const schedule = {
    startAt: startDate,
    temperatures: Array(arrayLength),
    maxTempAdjustment: maxTempAdjustment,
    durationInMinutes: arrayLength,
  };
  if (buySellStackedArray[0].length === 0) {
    schedule.temperatures.fill(-maxTempAdjustment, 0, arrayLength);
  } else {
    let n = 0;
    for (let i = 0; i < buySellStackedArray[0].length; i++) {
      schedule.temperatures.fill(-maxTempAdjustment, n, buySellStackedArray[0][i]);
      schedule.temperatures.fill(maxTempAdjustment, buySellStackedArray[0][i], buySellStackedArray[1][i]);
      n = buySellStackedArray[1][i];
    }
    schedule.temperatures.fill(-maxTempAdjustment, n, arrayLength);
  }

  schedule.trades = calculateValueDictlist(buySellStackedArray, buyPrices, sellPrices, startDate);
  return schedule;
}

function findTemp(date, schedule) {
  let diff = Math.round(date.diff(schedule.startAt).as("minutes"));
  return schedule.temperatures[diff];
}

function runBuySellAlgorithm(priceData, timeHeat1C, timeCool1C, maxTempAdjustment, minSavings) {
  const prices = [...priceData.map((pd) => pd.value)];
  const startDate = DateTime.fromISO(priceData[0].start);

  //pattern for how much power is procured/sold when.
  //This has, for now, just a flat aquisition/divestment profile
  const buyPattern = Array(Math.round(timeHeat1C * maxTempAdjustment * 2)).fill(1);
  const sellPattern = Array(Math.round(timeCool1C * maxTempAdjustment * 2)).fill(1);

  //Calculate what it will cost to procure/sell 1 kWh as a function of time
  const buyPrices = calculateOpportunities(prices, buyPattern, 1);
  const sellPrices = calculateOpportunities(prices, sellPattern, 1);

  //Find dates for when to procure/sell
  const buySell = findBestBuySellPattern(buyPrices, buyPattern.length, sellPrices, sellPattern.length);

  //Remove small/disputable gains (least profitable buy/sell pairs)
  const buySellCleaned = removeLowBuySellPairs(buySell, buyPrices, sellPrices, minSavings, startDate);

  //Calculate temperature adjustment as a function of time
  const schedule = calculateSchedule(startDate, buySellCleaned, buyPrices, sellPrices, maxTempAdjustment);

  return schedule;
}

module.exports = {
  runBuySellAlgorithm,
  findTemp,
  calculateOpportunities,
  findBestBuySellPattern,
  calculateValueDictlist,
  removeLowBuySellPairs,
  calculateSchedule,
};

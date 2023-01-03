"use strict";
const { DateTime } = require("luxon");
const { roundPrice, getDiffToNextOn } = require("./utils");

function calculateOpportunities(prices, pattern, amount) {
  //creating a price vector with minute granularity
  const tempPrice = Array(prices.length * 60).fill(0);
  for (let i = 0; i < prices.length; i++) {
    tempPrice.fill(prices[i], i * 60, (i + 1) * 60);
    //debugger;
  }

  //Calculate weighted pattern
  const weight = amount / pattern.reduce((a, b) => a + b, 0); //last calculates the sum of all numbers in the pattern
  const weightedPattern = pattern.map((x) => x * weight);

  //Calculating procurement opportunities. Sliding the pattern over the price vector to find the price for procuring
  //at time t
  const dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
  const procurementOpportunities = Array(prices.length * 60 - pattern.length + 1);
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
  const buyIndexes = [];
  const sellIndexes = [];
  let i = 0;
  while (i < priceBuy.length - 1) {
    // Find Local Minima
    // Note that the limit is (n-2) as we are
    // comparing present element to the next element
    while (i < priceBuy.length - 1 && priceBuy[i + 1] < priceBuy[i]) i++;

    // If we reached the end, break
    // as no further solution is possible
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

function calculateValueDictList(buySell, buyPrices, sellPrices, startDate) {
  const buySellValueDictList = [];
  for (let i = 0; i < buySell[0].length; i++) {
    const buyDateTime = startDate.plus({ minutes: buySell[0][i] });
    const sellDateTime = startDate.plus({ minutes: buySell[1][i] });
    if (i != 0) {
      const prevSellDateTime = startDate.plus({ minutes: buySell[1][i - 1] });
      buySellValueDictList.push({
        type: "sell - buy",
        tradeValue: roundPrice(sellPrices[buySell[1][i - 1]] - buyPrices[buySell[0][i]]),
        buyIndex: buySell[0][i],
        buyDate: buyDateTime,
        buyPrice: roundPrice(buyPrices[buySell[0][i]]),
        sellIndex: buySell[1][i - 1],
        sellDate: prevSellDateTime,
        sellPrice: roundPrice(sellPrices[buySell[1][i - 1]]),
      });
    }
    buySellValueDictList.push({
      type: "buy - sell",
      tradeValue: roundPrice(sellPrices[buySell[1][i]] - buyPrices[buySell[0][i]]),
      buyIndex: buySell[0][i],
      buyDate: buyDateTime,
      buyPrice: roundPrice(buyPrices[buySell[0][i]]),
      sellIndex: buySell[1][i],
      sellDate: sellDateTime,
      sellPrice: roundPrice(sellPrices[buySell[1][i]]),
    });
  }
  return buySellValueDictList;
}

function removeLowBuySellPairs(buySellPattern, buyPrices, sellPrices, minSavings, startDate) {
  let lowestSaving = -1;
  const buySellClone = Array.from(buySellPattern);

  while (minSavings >= lowestSaving) {
    const dictList = calculateValueDictList(buySellClone, buyPrices, sellPrices, startDate);
    if (dictList.length === 0) {
      return buySellClone;
    }
    let sellIndex = 0;
    let buyIndex = 0;
    for (let i = 0; i < dictList.length; i++) {
      if (i == 0 || dictList[i].tradeValue < lowestSaving) {
        lowestSaving = dictList[i].tradeValue;
        sellIndex = dictList[i].sellIndex;
        buyIndex = dictList[i].buyIndex;
      }
    }
    if (lowestSaving <= minSavings) {
      buySellClone[0] = buySellClone[0].filter((x) => x != buyIndex);
      buySellClone[1] = buySellClone[1].filter((x) => x != sellIndex);
    }
  }
  return buySellClone;
}

function calculateSchedule(
  startDate,
  buySellStackedArray,
  buyPrices,
  sellPrices,
  setpoint,
  maxTempAdjustment,
  boostTempHeat,
  boostTempCool,
  buyDuration,
  sellDuration
) {
  const arrayLength = buyPrices.length;
  const schedule = {
    startAt: startDate,
    temperatures: Array(arrayLength),
    maxTempAdjustment: maxTempAdjustment,
    durationInMinutes: arrayLength,
    boostTempHeat: boostTempHeat,
    boostTempCool: boostTempCool,
    heatingDuration: buyDuration,
    coolingDuration: sellDuration,
    minimalSchedule: [], //array of dicts with date as key and temperature as value
  };

  function pushTempChange(startDate, minutes, tempAdj, sp) {
    if (
      schedule.minimalSchedule.length > 0 &&
      schedule.minimalSchedule[schedule.minimalSchedule.length - 1].adjustment == tempAdj
    )
      return;
    schedule.minimalSchedule.push({
      startAt: startDate.plus({ minutes: minutes }).toISO(),
      setpoint: sp + tempAdj,
      adjustment: tempAdj,
    });
  }

  if (buySellStackedArray[0].length === 0) {
    //No procurements or sales scheduled
    schedule.minimalSchedule.push({ startDate: -maxTempAdjustment });
    schedule.temperatures.fill(-maxTempAdjustment, 0, arrayLength);
  } else {
    let lastBuyIndex = 0;
    let boostHeat;
    let boostCool;
    for (let i = 0; i < buySellStackedArray[0].length; i++) {
      const buyIndex = buySellStackedArray[1][i];
      const sellIndex = buySellStackedArray[0][i];

      //If this is the start of the time-series, do not boost the temperatures
      sellIndex == 0 ? (boostHeat = 0) : (boostHeat = boostTempHeat);
      lastBuyIndex == 0 ? (boostCool = 0) : (boostCool = boostTempCool);

      //Cooling period. Adding boosted cooling temperature for the period of divestment
      pushTempChange(startDate, lastBuyIndex, -maxTempAdjustment - boostCool, setpoint);
      if (sellIndex - lastBuyIndex <= sellDuration) {
        schedule.temperatures.fill(-maxTempAdjustment - boostCool, lastBuyIndex, sellIndex);
      } else {
        pushTempChange(startDate, lastBuyIndex + sellDuration, -maxTempAdjustment, setpoint);
        schedule.temperatures.fill(-maxTempAdjustment - boostCool, lastBuyIndex, lastBuyIndex + sellDuration);
        schedule.temperatures.fill(-maxTempAdjustment, lastBuyIndex + sellDuration, sellIndex);
      }
      //Heating period. Adding boosted heating temperature for the period of procurement
      pushTempChange(startDate, sellIndex, maxTempAdjustment + boostHeat, setpoint);
      if (buyIndex - sellIndex <= buyDuration) {
        schedule.temperatures.fill(maxTempAdjustment + boostHeat, sellIndex, buyIndex);
      } else {
        pushTempChange(startDate, sellIndex + buyDuration, maxTempAdjustment, setpoint);
        schedule.temperatures.fill(maxTempAdjustment + boostHeat, sellIndex, sellIndex + buyDuration);
        schedule.temperatures.fill(maxTempAdjustment, sellIndex + buyDuration, buyIndex);
      }
      lastBuyIndex = buyIndex;
    }

    //final fill
    pushTempChange(startDate, lastBuyIndex, -maxTempAdjustment - boostCool, setpoint);
    if (arrayLength - lastBuyIndex <= sellDuration) {
      schedule.temperatures.fill(-maxTempAdjustment - boostCool, lastBuyIndex, arrayLength);
    } else {
      pushTempChange(startDate, lastBuyIndex + sellDuration, -maxTempAdjustment, setpoint);
      schedule.temperatures.fill(-maxTempAdjustment - boostCool, lastBuyIndex, lastBuyIndex + sellDuration);
      schedule.temperatures.fill(-maxTempAdjustment, lastBuyIndex + sellDuration, arrayLength);
    }
  }

  schedule.trades = calculateValueDictList(buySellStackedArray, buyPrices, sellPrices, startDate);
  return schedule;
}

function findTemp(date, schedule) {
  let closestDate = null;
  let temp = null;
  schedule.minimalSchedule.forEach((e) => {
    const testDate = DateTime.fromISO(e.startAt);
    if (date < testDate) return;
    if (closestDate !== null) {
      if (closestDate > testDate) return; //
    }
    closestDate = testDate;
    temp = e.adjustment;
  });
  if (temp == null) temp = 0;
  return temp;
}

function runBuySellAlgorithm(
  priceData,
  timeHeat1C,
  timeCool1C,
  setpoint,
  boostTempHeat,
  boostTempCool,
  maxTempAdjustment,
  minSavings
) {
  const prices = [...priceData.map((pd) => pd.value)];
  const startDate = DateTime.fromISO(priceData[0].start);

  //pattern for how much power is procured/sold when.
  //This has, for now, just a flat acquisition/divestment profile
  const buyDuration = Math.round(timeHeat1C * maxTempAdjustment * 2);
  const sellDuration = Math.round(timeCool1C * maxTempAdjustment * 2);
  const buyPattern = Array(buyDuration).fill(1);
  const sellPattern = Array(sellDuration).fill(1);

  //Calculate what it will cost to procure/sell 1 kWh as a function of time
  const buyPrices = calculateOpportunities(prices, buyPattern, 1);
  const sellPrices = calculateOpportunities(prices, sellPattern, 1);

  //Find dates for when to procure/sell
  const buySell = findBestBuySellPattern(buyPrices, buyPattern.length, sellPrices, sellPattern.length);

  //Remove small/disputable gains (least profitable buy/sell pairs)
  const buySellCleaned = removeLowBuySellPairs(buySell, buyPrices, sellPrices, minSavings, startDate);

  //Calculate temperature adjustment as a function of time
  const schedule = calculateSchedule(
    startDate,
    buySellCleaned,
    buyPrices,
    sellPrices,
    setpoint,
    maxTempAdjustment,
    boostTempHeat,
    boostTempCool,
    buyDuration,
    sellDuration
  );

  return schedule;
}

module.exports = {
  runBuySellAlgorithm,
  findTemp,
  calculateOpportunities,
  findBestBuySellPattern,
  calculateValueDictList,
  removeLowBuySellPairs,
  calculateSchedule,
};

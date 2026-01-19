const { DateTime } = require("luxon");
const { roundPrice } = require("./utils");

// Build all periods that are different.
// prices is list with objects, objects have start and value. The last record also has end.
// start format: "2021-10-11T00:00:00.000+02:00"
// From config we use periods that have start and value. Start here is 2-digit hour.
// Here we do not cate about days or validFrom/To.
// We make a new period when the date shifts.
function addTariffToPrices(node, config, prices) {
  const configPeriods = config.periods.sort((a, b) => {
    if (a.start < b.start) return -1;
    if (a.start > b.start) return 1;
    return 0;
  });
  if (!prices.length || !configPeriods.length) {
    return [];
  }

  // Convert period values to number
  configPeriods.forEach((p) => {
    p.value = Number(p.value);
  });

  const firstStart = prices[0].start;
  const lastEnd = prices[prices.length - 1].end || prices[prices.length - 1].start;
  const validFrom = config.validFrom ?? firstStart.substring(0, 10);
  const validTo = config.validTo ?? lastEnd.substring(0, 10);

  const resultPeriods = {};
  // Add all periods for each date
  const dates = getUniqueDates(prices);
  const timezone = prices[0].start.substring(23); // +02:00 part
  dates.forEach((date) => {
    const periodsForDate = getPeriodsForDate(configPeriods, date, timezone);
    periodsForDate.forEach((p) => {
      resultPeriods[p.start] = { add: p.add, value: null };
    });
  });
  // Add all prices we already have
  prices.forEach((p) => {
    if (!resultPeriods[p.start]) {
      resultPeriods[p.start] = { add: null, value: null };
    }
    resultPeriods[p.start].value = p.value;
  });
  // Make a sorted list of periods with start and value
  const sortedPeriods = Object.keys(resultPeriods)
    .filter((start) => start >= firstStart && start < lastEnd)
    .sort()
    .map((start) => ({
      start,
      value: resultPeriods[start].value,
      add: resultPeriods[start].add,
    }));

  // Set value for periods that do not have it yet to the same as the period before
  // The first item will always have a value since it is the first value from prices.
  // Add value from config is conditions are met
  sortedPeriods.forEach((p, i) => {
    if (p.value === null) {
      p.value = sortedPeriods[i - 1].value;
    }
    if (p.add == null) {
      p.add = i > 0 ? sortedPeriods[i - 1].add : configPeriods[configPeriods.length - 1].value;
    }
    const day = new Date(p.start).toLocaleDateString("en-US", { weekday: "short" });
    if (p.start.substring(0, 10) >= validFrom && p.start.substring(0, 10) <= validTo && config.days[day]) {
      p.sum = roundPrice(p.value + p.add);
    } else {
      p.sum = p.value
    }
  });

  const result = sortedPeriods.map(p => ({start: p.start, value: p.sum}))

    // Set end on last period
  result[result.length - 1].end = lastEnd;

  return result;
}

function getUniqueDates(prices) {
  const result = [];
  const firstDate = prices[0].start.substring(0, 10);
  const lastDate = (prices[prices.length - 1].end || prices[prices.length - 1].start).substring(0, 10);
  // Add to results all dates from firstaDate to lastDate
  let currentDate = firstDate;
  while (currentDate <= lastDate) {
    result.push(currentDate);
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    currentDate = nextDate.toISOString().substring(0, 10);
  }
  return result;
}

function getPeriodsForDate(periods, date, timezone) {
  const result = [];
  periods.forEach((p) => {
    const hour = p.start.substring(0, 2);
    const minute = p.start.length === 5 ? p.substring(3, 5) : "00";
    result.push({ start: `${date}T${hour}:${minute}:00.000${timezone}`, add: p.value });
  });
  return result;
}

module.exports = {
  addTariffToPrices,
};

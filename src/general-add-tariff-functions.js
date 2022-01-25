const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const { roundPrice } = require("./utils");

function buildAllHours(node, periods) {
  const sortedPeriods = cloneDeep(periods);
  sortedPeriods.sort((a, b) => a.start - b.start);
  let res = [];
  let hour = 0;
  let current = sortedPeriods[sortedPeriods.length - 1];
  sortedPeriods.push({ start: 24, value: null });
  sortedPeriods.forEach((period) => {
    const nextHour = parseInt(period.start);
    while (hour < nextHour) {
      let value = 0;
      try {
        value = parseFloat(("" + current.value).replace(",", "."));
      } catch (e) {
        node.warn("Illegal number: " + current.value);
      }
      res[hour] = value;
      hour++;
    }
    current = period;
  });
  return res;
}

function addTariffToPrices(node, config, prices) {
  const allHours = buildAllHours(node, config.periods);
  const validFrom = DateTime.fromISO(config.validFrom || prices[0].start.substr(0, 10));
  const validTo = DateTime.fromISO(config.validTo || prices[prices.length - 1].start.substr(0, 10));
  prices.forEach((p, i) => {
    const date = DateTime.fromISO(p.start.substr(0, 10));
    const hour = DateTime.fromISO(p.start).hour;
    if (date >= validFrom && date <= validTo) {
      prices[i].value = roundPrice(prices[i].value + allHours[hour]);
    }
  });
}

module.exports = {
  addTariffToPrices,
  buildAllHours,
};

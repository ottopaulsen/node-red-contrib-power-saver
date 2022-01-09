const { DateTime } = require("luxon");
const expect = require("expect");
const { calculate_opportunities } = require("../src/strategy-temperature-manipulation-functions");
const price_data = require("./data/converted-prices.json");
const { cloneDeep } = require("lodash");

//User input
time_heat_1c = 55
time_cool_1c = 40
max_temp_adjustment = 0.61
min_saving_NOK_kWh=0.1

describe("test_opportunities", () => {
  it("can find best x", () => {
    let prices = [...price_data.map((pd) => pd.value)];
    prices = prices.slice(0,1)
    start_date =  DateTime.fromISO(price_data[0].start);
    buy_pattern= Array(5).fill(1)
    //Calculate what it will cost to procure/sell 1 kWh as a function of time
    expect(calculate_opportunities(prices,buy_pattern,1)).toEqual(Array(55).fill(prices(0)));
  });
});

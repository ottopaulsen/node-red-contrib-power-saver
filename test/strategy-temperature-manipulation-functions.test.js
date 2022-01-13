const { DateTime } = require("luxon");
const expect = require("expect");
const { calculate_schedule, calculate_opportunities, find_best_buy_sell_pattern, calculate_value_dictlist, remove_low_buysell_pairs } = require("../src/strategy-temperature-manipulation-functions");
const converted_prices = require("./data/converted-prices.json");
const decreasing_end_prices = require("./data/tibber-decreasing-24h.json");
const { cloneDeep } = require("lodash");

//User input
const time_heat_1c = 60
const time_cool_1c = 40
const max_temp_adjustment = 1
const min_saving_NOK_kWh = 0.1

describe("Test Temperature manipulation strategy functions", () => {
  before(function() {
    prices =  converted_prices.priceData.slice(0, 1).map((p) => p.value);
    decreasing_24h_prices =  decreasing_end_prices.priceData.slice(0, 1).map((p) => p.value);
    start_date =  DateTime.fromISO(converted_prices.priceData[0].start);
    buy_pattern= Array(Math.round(time_heat_1c*max_temp_adjustment*2)).fill(1)
    sell_pattern= Array(Math.round(time_cool_1c*max_temp_adjustment*2)).fill(1)
    console.log(prices);
  });
  
  it("Can calculate procurement opportunities", () => {
    let my_prices = prices.slice(0,1)
    let my_buy_pattern= Array(5).fill(1)
    //Calculate what it will cost to procure/sell 1 kWh as a function of time
    result = calculate_opportunities(my_prices, my_buy_pattern, 1)
    //Remove float precitions errors by rounding
    result = result.map(x => Math.round(x*1000000)/1000000);
    expect(result).toEqual(Array(56).fill(my_prices[0]));
  });
  
  it("Can find procuremnt pattern", () => {
    //Use a simple pricelist
    let my_prices = [1,2,2,1,8,1]

    let buy_prices = calculate_opportunities(my_prices, buy_pattern, 1)
    let sell_prices = calculate_opportunities(my_prices, sell_pattern, 1)

    let my_buy_sell = find_best_buy_sell_pattern(buy_prices,buy_pattern.length,sell_prices,sell_pattern.length);

    expect(my_buy_sell).toEqual([[0,141],[100,240]]);
  });

  it("Dictlist test", () => {
    let my_prices = [1,2,2,1,8,1]
    let my_buy_sell_indexes = [[0,173],[131,251]]
    let buy_prices = calculate_opportunities(my_prices, buy_pattern, 1)
    let sell_prices = calculate_opportunities(my_prices, sell_pattern, 1)
    result = calculate_value_dictlist(my_buy_sell_indexes, buy_prices, sell_prices, start_date)
    
    expect(result[0].sell_date).toEqual(start_date.plus({minutes: 131}));
  });

  it("Dictlist test at decreasing end", () => {
    let my_prices =  decreasing_end_prices.priceData.map((p) => p.value);
    let buy_prices = calculate_opportunities(my_prices, buy_pattern, 1)
    let sell_prices = calculate_opportunities(my_prices, sell_pattern, 1)

    let my_buy_sell = find_best_buy_sell_pattern(buy_prices,buy_pattern.length,sell_prices,sell_pattern.length);
    let my_schedule = calculate_schedule(start_date , my_buy_sell, buy_prices, sell_prices, max_temp_adjustment)
    expect(my_schedule.temperatures.at(-1)).toEqual(-max_temp_adjustment);
  });

  it("Check removal of low benefit buy-sell pairs", () => {
    let my_prices = [1,2,1,1.05,1,2]
    let buy_prices = calculate_opportunities(my_prices, buy_pattern, 1)
    let sell_prices = calculate_opportunities(my_prices, sell_pattern, 1)
    let my_buy_sell = find_best_buy_sell_pattern(buy_prices,buy_pattern.length,sell_prices,sell_pattern.length);

    let result = remove_low_buysell_pairs(my_buy_sell, buy_prices,sell_prices, min_saving_NOK_kWh, start_date)
    //Should remove the sell at 1.05 and the re-buy at 1 (only 0.05 difference)
    let compare = [my_buy_sell[0].slice(0,2),[my_buy_sell[1][0],my_buy_sell[1][2]]]

    expect(result).toEqual(compare);
  });


});

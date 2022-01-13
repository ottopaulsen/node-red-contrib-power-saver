const { DateTime } = require("luxon");
//const decreasing_end_prices = require("../test/data/tibber-decreasing-24h.json");

function calculate_opportunities(prices, pattern, amount){
    //creating a price vector with minute granularity
    var temp_price = Array(prices.length*60).fill(0)
    var end_index=[];
    for(i=0;i<prices.length;i++){
        temp_price.fill(prices[i],i*60,(i+1)*60);
        //debugger;
    }
    
    //Calculate weighted pattern
    var weight = amount/pattern.reduce((a, b) => a + b, 0) //last calculates the sum of all numbers in the pattern
    var weighted_pattern = pattern.map((x)=>x*weight)
    
    //Calculating procurement opportunities. Sliding the pattern over the price vector to find the price for procuring
    //at time t 
    dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
    var proc_opp = Array(prices.length*60-pattern.length+1)
    for(i=0;i<proc_opp.length;i++){
        proc_opp[i]=dot(weighted_pattern, temp_price.slice(i,i+pattern.length))
    }
    return proc_opp
}

// This function finds the buy sell
// schedule for maximum profit
// two vectors containing the buy and sell indexes are returned in an array
function find_best_buy_sell_pattern(price_buy, buy_length, price_sell, sell_length) {

    // Traverse through given price array
    var buy_indexes = []
    var sell_indexes = []
    let i = 0;
    while (i < price_buy.length - 1) {

        // Find Local Minima
        // Note that the limit is (n-2) as we are
        // comparing present element to the next element
        while ((i < price_buy.length - 1) && (price_buy[i + 1] < price_buy[i]))
            i++;

        // If we reached the end, break
        // as no further solution possible
        if (i == price_buy.length - 1)
            break;

        // Store the index of minima
        buy_indexes.push(i);
        // Move the next allowed maxima away from the minima - required due to the asymmetric buy/sell prices
        i=i+Math.round(buy_length/2)
        // Find Local Maxima
        // Note that the limit is (n-1) as we are
        // comparing to previous element
        while ((i < price_sell.length) && (price_sell[i] >= price_sell[i - 1]))
            i++;

        // Store the index of maxima
        sell_indexes.push(i - 1);
        i=i+Math.round(sell_length/2)
    }
    return [buy_indexes, sell_indexes]
}


function calculate_value_dictlist(buy_sell, buy_prices, sell_prices, start_date) {
    var buy_sell_value_dictlist=[]
    for(i=0;i<buy_sell[0].length;i++){
        
        let buy_datetime =start_date.plus({minutes: buy_sell[0][i]})
        let sell_datetime =start_date.plus({minutes: buy_sell[1][i]})
        if(i!=0) {
            let prev_sell_datetime = start_date.plus({minutes: buy_sell[1][i-1]})
            buy_sell_value_dictlist.push({type: 'sell - buy', value: sell_prices[buy_sell[1][i-1]]-buy_prices[buy_sell[0][i]], buy: buy_sell[0][i], buy_date: buy_datetime, sell: buy_sell[1][i-1], sell_date: prev_sell_datetime}) 
        }
        buy_sell_value_dictlist.push({type: 'buy - sell', value: sell_prices[buy_sell[1][i]]-buy_prices[buy_sell[0][i]], buy: buy_sell[0][i], buy_date: buy_datetime, sell: buy_sell[1][i], sell_date: sell_datetime}) 
    }
    return buy_sell_value_dictlist
}

function remove_low_buysell_pairs(buy_sell_pattern, buy_prices, sell_prices, min_saving_NOK_kWh, start_date){
    var min_saving = -1
    var buy_sell_clone= Array.from(buy_sell_pattern);
    while(min_saving_NOK_kWh>=min_saving){
        dictlist= calculate_value_dictlist(buy_sell_clone,buy_prices,sell_prices, start_date)
        let sell_index = 0
        let buy_index = 0
        for(i=0;i<dictlist.length;i++){
            if((i==0)||(dictlist[i].value<min_saving)){
                min_saving=dictlist[i].value
                sell_index = dictlist[i].sell
                buy_index = dictlist[i].buy
            }
        }
        if(min_saving<=min_saving_NOK_kWh){
            buy_sell_clone[0]=buy_sell_clone[0].filter(x=>x!=buy_index)
            buy_sell_clone[1]=buy_sell_clone[1].filter(x=>x!=sell_index)
        }
    }
    return buy_sell_clone
}

function calculate_schedule(start_date , buy_sell_stacked_array, max_temp_adjustment, array_length){
    let schedule={start_at: start_date, temperatures: Array(array_length), max_temp_adjustment: max_temp_adjustment, duration_in_minutes: array_length}
    if(buy_sell_stacked_array[0].length===0){
        schedule.temperatures.fill(-max_temp_adjustment,0,array_length)
    } else{
        n=0
        for(i=0;i<buy_sell_stacked_array[0].length;i++){
            schedule.temperatures.fill(-max_temp_adjustment,n,buy_sell_stacked_array[0][i])
            schedule.temperatures.fill(max_temp_adjustment,buy_sell_stacked_array[0][i],buy_sell_stacked_array[1][i])
            n=buy_sell_stacked_array[1][i]
        }
        schedule.temperatures.fill(-max_temp_adjustment,n,array_length)
    }
    return schedule
}

function find_temp(date, schedule){
    var diff = Math.round(date.diff(schedule.start_at).as('minutes'))
    return schedule.temperatures[diff]
}

function run_buy_sell_algorithm(price_data,time_heat_1c,time_cool_1c,max_temp_adjustment,min_saving_NOK_kWh) {
    var prices = [...price_data.map((pd) => pd.value)]
    //dates = [...price_data.map((pd) => pd.start)]
    var start_date =  DateTime.fromISO(price_data[0].start);
    //prices= prices.slice(0,16)
    
    //pattern for how much power is procured/sold when. 
    //This has, for now, just a flat aquisition/divestment profile
    var buy_pattern= Array(Math.round(time_heat_1c*max_temp_adjustment*2)).fill(1)
    var sell_pattern= Array(Math.round(time_cool_1c*max_temp_adjustment*2)).fill(1)
    
    //Calculate what it will cost to procure/sell 1 kWh as a function of time
    var buy_prices=calculate_opportunities(prices,buy_pattern,1);
    var sell_prices=calculate_opportunities(prices,sell_pattern,1)
    
    //Find dates for when to procure/sell
    var buy_sell = find_best_buy_sell_pattern(buy_prices,buy_pattern.length,sell_prices,sell_pattern.length)
        
    //Remove small/disputable gains (least profitable buy/sell pairs)
    var buy_sell_cleaned = remove_low_buysell_pairs(buy_sell,buy_prices,sell_prices,min_saving_NOK_kWh, start_date)
    var buy_sell_value_dictlist_cleaned = calculate_value_dictlist(buy_sell_cleaned,buy_prices,sell_prices, start_date)

    //Calculate temperature adjustment as a function of time
    let schedule = calculate_schedule(start_date, buy_sell_cleaned,max_temp_adjustment, buy_prices.length)
    
    return schedule
}


function test(){ //Set up price data
    price_data = [2,3,4] //decreasing_end_prices.priceData;
    //User input
    time_heat_1c = 55
    time_cool_1c = 40
    max_temp_adjustment = 0.61
    min_saving_NOK_kWh = 0.1
    debugger
    let schedule = run_buy_sell_algorithm(price_data, time_heat_1c, time_cool_1c,max_temp_adjustment,min_saving_NOK_kWh)
    dT = find_temp(DateTime.local(2022, 1, 2),schedule)
    debugger
}

module.exports = {
    run_buy_sell_algorithm,
    find_temp,
    calculate_opportunities,
    find_best_buy_sell_pattern,
    calculate_value_dictlist,
    remove_low_buysell_pairs,
    calculate_schedule
};

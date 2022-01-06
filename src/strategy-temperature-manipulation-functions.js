const { DateTime } = require("luxon");

function calculate_opportunities(prices, pattern, amount){
    //creating a price vector with minute granularity
    var temp_price = Array(prices.length*60).fill(0)
    end_index=[];
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


function calculate_value_dictlist(buy_sell, buy_prices, sell_prices) {
    buy_sell_value_dictlist=[]
    for(i=0;i<buy_sell[0].length;i++){
        if(i!=0) {
            buy_sell_value_dictlist.push({type: 'sell - buy', value: sell_prices[buy_sell[1][i-1]]-buy_prices[buy_sell[0][i]], buy: buy_sell[0][i], sell: buy_sell[1][i-1]}) 
        }
        buy_sell_value_dictlist.push({type: 'buy - sell', value: sell_prices[buy_sell[1][i]]-buy_prices[buy_sell[0][i]], buy: buy_sell[0][i], sell: buy_sell[1][i]}) 
    }
    return buy_sell_value_dictlist
}

function remove_low_buysell_pairs(buy_sell_pattern, buy_prices, sell_prices, min_saving_NOK_kWh){
    min_saving = -1
    buy_sell_clone= Array.from(buy_sell_pattern);
    while(min_saving_NOK_kWh>=min_saving){
        dictlist= calculate_value_dictlist(buy_sell_clone,buy_prices,sell_prices)
        sell_index = 0
        buy_index = 0
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


function find_temp(date, schedule){
    date_start = schedule.datetimes[0]
    diff = Math.round(date.diff(date_start).as('minutes'))
    return schedule.temperatures[diff]
}

function run_buy_sell_algorithm(price_data,time_heat_1c,time_cool_1c,max_temp_adjustment,min_saving_NOK_kWh) {
    prices = [...price_data.map((pd) => pd.value)]
    //dates = [...price_data.map((pd) => pd.start)]
    start_date =  DateTime.fromISO(price_data[0].start);
    //prices= prices.slice(0,16)
    
    //pattern for how much power is procured/sold when. 
    //This has, for now, just a flat aquisition/divestment profile
    buy_pattern= Array(Math.round(time_heat_1c*max_temp_adjustment*2)).fill(1)
    sell_pattern= Array(Math.round(time_cool_1c*max_temp_adjustment*2)).fill(1)
    
    //Calculate what it will cost to procure/sell 1 kWh as a function of time
    buy_prices=calculate_opportunities(prices,buy_pattern,1);
    sell_prices=calculate_opportunities(prices,sell_pattern,1)
    
    //Find dates for when to procure/sell
    buy_sell = find_best_buy_sell_pattern(buy_prices,buy_pattern.length,sell_prices,sell_pattern.length)
        
    //Remove small/disputable gains (least profitable buy/sell pairs)
    buy_sell_cleaned = remove_low_buysell_pairs(buy_sell,buy_prices,sell_prices,min_saving_NOK_kWh)
    buy_sell_value_dictlist_cleaned = calculate_value_dictlist(buy_sell_cleaned,buy_prices,sell_prices)

    //Calculate temperature adjustment as a function of time
    buy_sell_dates = [buy_sell_cleaned[0].map(x=>start_date.plus({minutes: x})),buy_sell_cleaned[1].map(x=>start_date.plus({minutes: x}))]
    buy_sell_dates_text = Array(buy_sell_dates[0].length)
    temp_array = Array(buy_prices.length-buy_pattern.length)
    date_array=Array(buy_prices.length-buy_pattern.length)
    n=0
    for(i=0;i<buy_sell_dates[0].length;i++){
        buy_sell_dates_text[i]= "buy at: " + buy_sell_dates[0][i].toFormat('dd hh mm') + " Sell at " + buy_sell_dates[1][i].toFormat('dd hh mm');
        temp_array.fill(-max_temp_adjustment,n,buy_sell_cleaned[0][i])
        temp_array.fill(max_temp_adjustment,buy_sell_cleaned[0][i],buy_sell_cleaned[1][i])
        date_array[i]=start_date.plus({minutes: i})
        n=buy_sell_cleaned[1][i]
    }
    
    return {temperatures: temp_array, datetimes: date_array, buy_sell_dictlist: buy_sell_value_dictlist_cleaned}
}

function test(){
    //Set up price data
    price_data = [{"value":1.6696,"start":"2022-01-01T00:00:00.000+01:00"},{"value":1.6247,"start":"2022-01-01T01:00:00.000+01:00"},{"value":1.6594,"start":"2022-01-01T02:00:00.000+01:00"},{"value":1.4017,"start":"2022-01-01T03:00:00.000+01:00"},{"value":1.413,"start":"2022-01-01T04:00:00.000+01:00"},{"value":1.4324,"start":"2022-01-01T05:00:00.000+01:00"},{"value":1.5367,"start":"2022-01-01T06:00:00.000+01:00"},{"value":1.4908,"start":"2022-01-01T07:00:00.000+01:00"},{"value":1.4895,"start":"2022-01-01T08:00:00.000+01:00"},{"value":1.4818,"start":"2022-01-01T09:00:00.000+01:00"},{"value":1.509,"start":"2022-01-01T10:00:00.000+01:00"},{"value":1.472,"start":"2022-01-01T11:00:00.000+01:00"},{"value":1.4732,"start":"2022-01-01T12:00:00.000+01:00"},{"value":1.5096,"start":"2022-01-01T13:00:00.000+01:00"},{"value":1.5653,"start":"2022-01-01T14:00:00.000+01:00"},{"value":1.5696,"start":"2022-01-01T15:00:00.000+01:00"},{"value":1.7033,"start":"2022-01-01T16:00:00.000+01:00"},{"value":1.8828,"start":"2022-01-01T17:00:00.000+01:00"},{"value":1.8921,"start":"2022-01-01T18:00:00.000+01:00"},{"value":1.8059,"start":"2022-01-01T19:00:00.000+01:00"},{"value":1.7628,"start":"2022-01-01T20:00:00.000+01:00"},{"value":1.7565,"start":"2022-01-01T21:00:00.000+01:00"},{"value":1.6969,"start":"2022-01-01T22:00:00.000+01:00"},{"value":1.5513,"start":"2022-01-01T23:00:00.000+01:00"},{"value":1.4302,"start":"2022-01-02T00:00:00.000+01:00"},{"value":1.4065,"start":"2022-01-02T01:00:00.000+01:00"},{"value":1.3423,"start":"2022-01-02T02:00:00.000+01:00"},{"value":1.3169,"start":"2022-01-02T03:00:00.000+01:00"},{"value":1.3114,"start":"2022-01-02T04:00:00.000+01:00"},{"value":1.3339,"start":"2022-01-02T05:00:00.000+01:00"},{"value":1.4104,"start":"2022-01-02T06:00:00.000+01:00"},{"value":1.3259,"start":"2022-01-02T07:00:00.000+01:00"},{"value":1.4048,"start":"2022-01-02T08:00:00.000+01:00"},{"value":1.4584,"start":"2022-01-02T09:00:00.000+01:00"},{"value":1.535,"start":"2022-01-02T10:00:00.000+01:00"},{"value":1.527,"start":"2022-01-02T11:00:00.000+01:00"},{"value":1.4161,"start":"2022-01-02T12:00:00.000+01:00"},{"value":1.4031,"start":"2022-01-02T13:00:00.000+01:00"},{"value":1.4042,"start":"2022-01-02T14:00:00.000+01:00"},{"value":1.4881,"start":"2022-01-02T15:00:00.000+01:00"},{"value":1.5396,"start":"2022-01-02T16:00:00.000+01:00"},{"value":1.6332,"start":"2022-01-02T17:00:00.000+01:00"},{"value":1.7105,"start":"2022-01-02T18:00:00.000+01:00"},{"value":1.615,"start":"2022-01-02T19:00:00.000+01:00"},{"value":1.4648,"start":"2022-01-02T20:00:00.000+01:00"},{"value":1.3882,"start":"2022-01-02T21:00:00.000+01:00"},{"value":1.3208,"start":"2022-01-02T22:00:00.000+01:00"},{"value":1.3877,"start":"2022-01-02T23:00:00.000+01:00"}]
    //User input
    time_heat_1c = 55
    time_cool_1c = 40
    max_temp_adjustment = 0.61
    min_saving_NOK_kWh=0.1
    res = run_buy_sell_algorithm(price_data, time_heat_1c, time_cool_1c,max_temp_adjustment,min_saving_NOK_kWh)
    dT = find_temp(DateTime.local(2022, 1, 2),res)
    debugger
}

module.exports = {
    run_buy_sell_algorithm,
    find_temp,
};

test()
const { DateTime } = require("luxon");
//const { loadDayData } = require("./utils");
const { run_buy_sell_algorithm, find_temp} = require("./strategy-temperature-manipulation-functions");
//const { difference } = require("lodash");


module.exports = function(RED) {
  function TempMan(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.time_heat_1c = Number(config.time_heat_1c);
    node.time_cool_1c = Number(config.time_cool_1c);
    node.max_temp_adjustment = Number(config.max_temp_adjustment);
    node.min_saving_NOK_kWh = Number(config.min_saving_NOK_kWh);
    // sanitise disabled output as this is used when all else fails
    if (isNaN(node.disabled_op)) {
        node.disabled_op = 0;
    }
    
    this.on('input', function(msg) {
      var newMsg = null;
      
      // Using msg.* to change specific TM property.
      if (msg.hasOwnProperty('time_heat_1c')) node.time_heat_1c = Number(msg.time_heat_1c);
      if (msg.hasOwnProperty('time_cool_1c')) node.time_cool_1c = Number(msg.time_cool_1c);
      if (msg.hasOwnProperty('max_temp_adjustment')) node.max_temp_adjustment = Number(msg.max_temp_adjustment);
      if (msg.hasOwnProperty('min_saving_NOK_kWh')) node.min_saving_NOK_kWh = Number(msg.min_saving_NOK_kWh);
      
      if (msg.topic == 'configure') {
        node.setpoint = Number(msg.payload);
      } else {
        // anything else is assumed to be a process value
        
        node.priceData = msg.payload.priceData;
    
        node.schedule = run_buy_sell_algorithm(node.priceData, node.time_heat_1c, node.time_cool_1c,node.max_temp_adjustment,node.min_saving_NOK_kWh)
        node.dT = find_temp(DateTime.now(),node.schedule)
        
        // Send output
        node.send([{payload: node.dT}, {payload: node.schedule}]);
      }
  
    });
  }

  RED.nodes.registerType("ps-strategy-temperature-manipulation",TempMan);
};
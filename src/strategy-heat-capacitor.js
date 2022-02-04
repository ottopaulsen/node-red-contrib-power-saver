"use strict";
const { DateTime } = require("luxon");
const { validateInput } = require("./handle-input");
const { run_buy_sell_algorithm, find_temp } = require("./strategy-heat-capacitor-functions");

module.exports = function (RED) {
  function TempMan(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.time_heat_1c = Number(config.time_heat_1c);
    node.time_cool_1c = Number(config.time_cool_1c);
    node.max_temp_adjustment = Number(config.max_temp_adjustment);
    node.min_saving_NOK_kWh = Number(config.min_saving_NOK_kWh);
    // sanitise disabled output as this is used when all else fails
    if (isNaN(node.disabled_op)) {
      node.disabled_op = 0;
    }

    this.on("input", function (msg) {

      if(validateInput(node,msg)){
        // Using msg.* to change specific TM property.
        if (msg.hasOwnProperty("payload")) {
          if (msg.payload.hasOwnProperty("config")) {
            if (msg.payload.config.hasOwnProperty("time_heat_1c")) node.time_heat_1c = Number(msg.payload.config.time_heat_1c);
            if (msg.payload.config.hasOwnProperty("time_cool_1c")) node.time_cool_1c = Number(msg.payload.config.time_cool_1c);
            if (msg.payload.config.hasOwnProperty("max_temp_adjustment")) node.max_temp_adjustment = Number(msg.payload.config.max_temp_adjustment);
            if (msg.payload.config.hasOwnProperty("min_saving_NOK_kWh")) node.min_saving_NOK_kWh = Number(msg.payload.config.min_saving_NOK_kWh);
          }
          if (msg.payload.hasOwnProperty("priceData")){
  
            // anything else is assumed to be a process value
    
            node.priceData = msg.payload.priceData;
    
            node.schedule = run_buy_sell_algorithm(
              node.priceData,
              node.time_heat_1c,
              node.time_cool_1c,
              node.max_temp_adjustment,
              node.min_saving_NOK_kWh
            );

            //node.dT = find_temp(DateTime.now(), node.schedule);
            node.dT = find_temp(msg.payload.time, node.schedule);
    
            // Send output
            node.send([{ payload: node.dT }, { payload: node.schedule }]);
          } 
        } 
      }
    });
  }

  RED.nodes.registerType("ps-strategy-heat-capacitor", TempMan);
};

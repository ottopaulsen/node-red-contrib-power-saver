"use strict";
const { DateTime } = require("luxon");
const { validateInput } = require("./handle-input");
const { run_buy_sell_algorithm, find_temp } = require("./strategy-heat-capacitor-functions");

module.exports = function (RED) {
  function TempMan(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.timeHeat1C = Number(config.timeHeat1C);
    node.timeCool1C = Number(config.timeCool1C);
    node.setpoint = Number(config.setpoint);
    node.maxTempAdjustment = Number(config.maxTempAdjustment);
    node.minSavings = Number(config.minSavings);
    // sanitise disabled output as this is used when all else fails
    if (isNaN(node.disabled_op)) {
      node.disabled_op = 0;
    }

    this.on("input", function (msg) {

      if(validateInput(node,msg)){
        // Using msg.* to change specific TM property.
        if (msg.hasOwnProperty("payload")) {
          if (msg.payload.hasOwnProperty("config")) {
            if (msg.payload.config.hasOwnProperty("timeHeat1C")) node.timeHeat1C = Number(msg.payload.config.timeHeat1C);
            if (msg.payload.config.hasOwnProperty("timeCool1C")) node.timeCool1C = Number(msg.payload.config.timeCool1C);
            if (msg.payload.config.hasOwnProperty("setpoint")) node.setpoint = Number(msg.payload.config.setpoint);
            if (msg.payload.config.hasOwnProperty("maxTempAdjustment")) node.maxTempAdjustment = Number(msg.payload.config.maxTempAdjustment);
            if (msg.payload.config.hasOwnProperty("minSavings")) node.minSavings = Number(msg.payload.config.minSavings);
          }
          if (msg.payload.hasOwnProperty("priceData")){
  
            // anything else is assumed to be a process value
    
            node.priceData = msg.payload.priceData;
    
            node.schedule = run_buy_sell_algorithm(
              node.priceData,
              node.timeHeat1C,
              node.timeCool1C,
              node.maxTempAdjustment,
              node.minSavings
            );

            if (msg.payload.hasOwnProperty("time")){
              node.dT = find_temp(msg.payload.time, node.schedule);
            }else{
              node.dT = find_temp(DateTime.now(), node.schedule);
            }

            node.T = node.setpoint + node.dT;
            // Send output
            node.send([{payload: node.T, topic: "setpoint" }, { payload: node.dT, topic: "adjustment" }, { payload: node.schedule }]);
          } 
        } 
      }
    });
  }

  RED.nodes.registerType("ps-strategy-heat-capacitor", TempMan);
};

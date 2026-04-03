"use strict";
const { DateTime } = require("luxon");
const { validateInput } = require("./handle-input");
const { runBuySellAlgorithm, findTemp } = require("./strategy-heat-capacitor-functions");
const { version } = require("../package.json");

module.exports = function (RED) {
  function TempMan(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.timeHeat1C = Number(config.timeHeat1C);
    node.timeCool1C = Number(config.timeCool1C);
    node.setpoint = Number(config.setpoint);
    node.maxTempAdjustment = Number(config.maxTempAdjustment);
    node.boostTempHeat = Number(config.boostTempHeat);
    node.boostTempCool = Number(config.boostTempCool);
    node.minSavings = Number(config.minSavings);
    // sanitise disabled output as this is used when all else fails
    if (isNaN(node.disabled_op)) {
      node.disabled_op = 0;
    }

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    this.on("input", function (msg) {
      if (!validateInput(node, msg)) return;
      if (!("payload" in msg)) return;

      if ("commands" in msg.payload) {
        //Commands override input
        if ("schedule" in node) {
          //Do not execute if schedule is missing
          if ("time" in msg.payload) {
            node.dT = findTemp(msg.payload.time, node.schedule);
          } else {
            node.dT = findTemp(DateTime.now(), node.schedule);
          }
          node.T = node.setpoint + node.dT;
          if ("sendSchedule" in msg.payload.commands) {
            // Send output if schedule exists
            if ("schedule" in node && msg.payload.commands.sendSchedule == true) {
              node.send([
                null,
                null,
                { payload: node.schedule },
                { payload: { setpoint_now: node.T, schedule: node.schedule.minimalSchedule } },
              ]);
            }
          }
          if ("sendOutput" in msg.payload.commands && msg.payload.commands.sendOutput == true) {
            // Send output if schedule exists
            node.send([
              { payload: node.T, topic: "setpoint", time: node.schedule.time, version: version },
              { payload: node.dT, topic: "adjustment", time: node.schedule.time, version: version },
              null,
              null,
            ]);
          }
        }
        return;
      }
      // Using msg.payload.config to change specific properties
      if ("config" in msg.payload) {
        if ("timeHeat1C" in msg.payload.config) node.timeHeat1C = Number(msg.payload.config.timeHeat1C);
        if ("timeCool1C" in msg.payload.config) node.timeCool1C = Number(msg.payload.config.timeCool1C);
        if ("setpoint" in msg.payload.config) node.setpoint = Number(msg.payload.config.setpoint);
        if ("maxTempAdjustment" in msg.payload.config)
          node.maxTempAdjustment = Number(msg.payload.config.maxTempAdjustment);
        if ("boostTempHeat" in msg.payload.config)
          node.boostTempHeat = Number(msg.payload.config.boostTempHeat);
        if ("boostTempCool" in msg.payload.config)
          node.boostTempCool = Number(msg.payload.config.boostTempCool);
        if ("minSavings" in msg.payload.config) node.minSavings = Number(msg.payload.config.minSavings);
      }

      //merge pricedata to escape some midnight issues. Store max 72 hour history
      if ("priceData" in msg.payload) {
        if ("priceData" in node) {
          node.priceData = mergePriceData(node.priceData, msg.payload.priceData);
        } else {
          node.priceData = msg.payload.priceData;
        }
        if (node.priceData.length) {
          const latestStart = DateTime.fromISO(node.priceData[node.priceData.length - 1].start);
          const cutoff = latestStart.minus({ hours: 72 });
          node.priceData = node.priceData.filter((entry) => DateTime.fromISO(entry.start) >= cutoff);
        }
      }

      if ("priceData" in node) {
        node.schedule = runBuySellAlgorithm(
          node.priceData,
          node.timeHeat1C,
          node.timeCool1C,
          node.setpoint,
          node.boostTempHeat,
          node.boostTempCool,
          node.maxTempAdjustment,
          node.minSavings,
        );

        if ("time" in msg.payload) {
          node.dT = findTemp(msg.payload.time, node.schedule);
        } else {
          node.dT = findTemp(DateTime.now(), node.schedule);
        }

        node.T = node.setpoint + node.dT;

        //Add config to statistics
        node.schedule.config = {
          timeHeat1C: node.timeHeat1C,
          timeCool1C: node.timeCool1C,
          setpoint: node.setpoint,
          maxTempAdjustment: node.maxTempAdjustment,
          boostTempHeat: node.boostTempHeat,
          boostTempCool: node.boostTempCool,
          minSavings: node.minSavings,
        };

        node.schedule.priceData = node.priceData;
        node.schedule.time = DateTime.now().toISO();
        node.schedule.version = version;

        // Send output
        node.send([
          { payload: node.T, topic: "setpoint", time: node.schedule.time, version: version },
          { payload: node.dT, topic: "adjustment", time: node.schedule.time, version: version },
          { payload: node.schedule },
          { payload: { setpoint_now: node.T, schedule: node.schedule.minimalSchedule } },
        ]);
      }
    });
  }

  RED.nodes.registerType("ps-strategy-heat-capacitor", TempMan);
};

function mergePriceData(priceDataA, priceDataB) {
  const mergedEntries = new Map();
  priceDataA.concat(priceDataB).forEach((entry) => {
    if (!entry?.start) {
      return;
    }
    const existing = mergedEntries.get(entry.start);
    mergedEntries.set(entry.start, Object.assign({}, existing, entry));
  });

  return Array.from(mergedEntries.values()).sort(
    (a, b) => DateTime.fromISO(a.start).toMillis() - DateTime.fromISO(b.start).toMillis(),
  );
}

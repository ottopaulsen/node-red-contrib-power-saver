const { msgHasSchedule, mergeSchedules, saveSchedule, validateSchedule } = require("./schedule-merger-functions.js");
const { getEffectiveConfig, makeScheduleFromHours, saveOriginalConfig } = require("./utils.js");
const { DateTime } = require("luxon");
const nanoTime = require("nano-time");
const { handleOutput } = require("./handle-output");
const { getCommands } = require("./handle-input");

module.exports = function (RED) {
  function ScheduleMerger(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    saveOriginalConfig(node, {
      logicFunction: config.logicFunction,
      sendCurrentValueWhenRescheduling: config.sendCurrentValueWhenRescheduling,
      contextStorage: config.contextStorage || "default",
      schedulingDelay: config.schedulingDelay || 2000,
    });

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      const config = getEffectiveConfig(node, msg);

      const commands = getCommands(msg);

      // TODO (otto): Handle commands, also if only commands are sent

      const myTime = nanoTime();
      if (msgHasSchedule(msg)) {
        const validationError = validateSchedule(msg);
        if (validationError) {
          node.warn(validationError);
          node.status({ fill: "red", shape: "dot", text: validationError });
          return;
        }
        saveSchedule(node, msg);
        // Wait for more schedules to arrive before proceeding
        node.lastSavedScheduleTime = myTime;
      }

      // Perform actions based on commands here

      setTimeout(() => {
        if (node.lastSavedScheduleTime !== myTime) {
          // Another schedule has arrived later
          return;
        }

        const hours = mergeSchedules(node, node.logicFunction);
        const schedule = makeScheduleFromHours(hours);

        const plan = {
          hours,
          schedule,
          source: node.name,
        };

        const planFromTime = msg.payload.time ? DateTime.fromISO(msg.payload.time) : DateTime.now();

        const outputCommands = {
          sendOutput: commands.sendOutput !== false,
          sendSchedule: commands.sendSchedule !== false,
          runSchedule: true,
          sentOnCommand: !!commands.sendSchedule,
        };

        handleOutput(node, config, plan, outputCommands, planFromTime);
      }, node.schedulingDelay);
    });
  }
  RED.nodes.registerType("ps-schedule-merger", ScheduleMerger);
};

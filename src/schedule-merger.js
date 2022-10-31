const {
  msgHasSchedule,
  mergeSchedules,
  saveSchedule,
  validateSchedule,
  mergerShallSendSchedule,
} = require("./schedule-merger-functions.js");
const { booleanConfig, getEffectiveConfig, makeScheduleFromHours, saveOriginalConfig } = require("./utils.js");
const { DateTime } = require("luxon");
const nanoTime = require("nano-time");
const { handleOutput, shallSendOutput } = require("./handle-output");
const { addLastSwitchIfNoSchedule, getCommands } = require("./handle-input");

module.exports = function (RED) {
  function ScheduleMerger(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    saveOriginalConfig(node, {
      logicFunction: config.logicFunction,
      schedulingDelay: config.schedulingDelay || 2000,
      outputIfNoSchedule: booleanConfig(config.outputIfNoSchedule),
    });

    node.on("close", function () {
      const node = this;
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      const node = this;
      if (msg.payload.hours) {
        // Delete config from strategy nodes so it does not merge
        // with config for this node.
        delete msg.payload.config;
      }
      const config = getEffectiveConfig(node, msg);
      const commands = getCommands(msg);
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

      setTimeout(
        () => {
          if (node.lastSavedScheduleTime !== myTime && msgHasSchedule(msg) && !commands.replan) {
            // Another schedule has arrived later
            return;
          }

          const hours = mergeSchedules(node, node.logicFunction);
          const schedule = makeScheduleFromHours(hours);
          addLastSwitchIfNoSchedule(schedule, hours, node);

          const plan = {
            hours,
            schedule,
            source: node.name,
          };

          const planFromTime = msg.payload.time ? DateTime.fromISO(msg.payload.time) : DateTime.now();

          const outputCommands = {
            sendOutput: shallSendOutput(msg, commands),
            sendSchedule: mergerShallSendSchedule(msg, commands),
            runSchedule: commands.runSchedule || (commands.runSchedule !== false && msgHasSchedule(msg)),
          };

          handleOutput(node, config, plan, outputCommands, planFromTime);
        },
        commands.replan ? 0 : node.schedulingDelay
      );
    });
  }
  RED.nodes.registerType("ps-schedule-merger", ScheduleMerger);
};

const {
  msgHasSchedule,
  mergeSchedules,
  saveSchedule,
  validateSchedule,
  mergerShallSendOutput,
  mergerShallSendSchedule,
} = require("./schedule-merger-functions.js");
const {
  booleanConfig,
  fixOutputValues,
  getEffectiveConfig,
  getOutputForTime,
  makeScheduleFromHours,
  saveOriginalConfig,
} = require("./utils.js");
const { DateTime } = require("luxon");
const nanoTime = require("nano-time");
const { handleOutput } = require("./handle-output");
const { addLastSwitchIfNoSchedule, getCommands } = require("./handle-input");

module.exports = function (RED) {
  function ScheduleMerger(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const validConfig = {
      logicFunction: config.logicFunction,
      schedulingDelay: config.schedulingDelay || 2000,
      sendCurrentValueWhenRescheduling: config.sendCurrentValueWhenRescheduling,
      outputIfNoSchedule: booleanConfig(config.outputIfNoSchedule),
      outputValueForOn: config.outputValueForOn || true,
      outputValueForOff: config.outputValueForOff || false,
      outputValueForOntype: config.outputValueForOntype || "bool",
      outputValueForOfftype: config.outputValueForOfftype || "bool",
      override: "auto",
    };

    fixOutputValues(validConfig);
    saveOriginalConfig(node, validConfig);

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      if (msg.payload?.name && msg.payload.name !== node.name) {
        // If payload.name is set, and does not match this nodes name, discard message
        return;
      }
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
          const currentOutput = node.context().get("currentOutput", node.contextStorage);
          const plannedOutputNow = getOutputForTime(plan.schedule, planFromTime, node.outputIfNoSchedule);

          const outputCommands = {
            sendOutput: mergerShallSendOutput(
              msg,
              commands,
              currentOutput,
              plannedOutputNow,
              node.sendCurrentValueWhenRescheduling
            ),
            sendSchedule: mergerShallSendSchedule(msg, commands),
            runSchedule: commands.runSchedule || (commands.runSchedule !== false && msgHasSchedule(msg)),
          };

          handleOutput(node, config, plan, outputCommands, planFromTime);
        },
        commands.replan || msg.payload.config ? 0 : node.schedulingDelay
      );
    });
  }
  RED.nodes.registerType("ps-schedule-merger", ScheduleMerger);
};

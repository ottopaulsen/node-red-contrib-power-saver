const { mergeSchedules, saveSchedule, validateSchedule } = require("./schedule-merger-functions.js");
const { getEffectiveConfig, makeScheduleFromHours, saveOriginalConfig } = require("./utils.js");
const { version } = require("../package.json");
const { DateTime } = require("luxon");
const nanoTime = require("nano-time");
const { runSchedule } = require("./handle-output");

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

      const validationError = validateSchedule(msg);
      if (validationError) {
        node.warn(validationError);
        node.status({ fill: "red", shape: "dot", text: validationError });
        return;
      }
      saveSchedule(node, msg);

      // Perform actions based on commands here

      // Wait for more schedules to arrive before proceeding
      const myTime = nanoTime();
      node.lastSavedScheduleTime = myTime;

      setTimeout(() => {
        if (node.lastSavedScheduleTime !== myTime) {
          // Another schedule has arrived later
          return;
        }

        const hours = mergeSchedules(node, node.logicFunction);
        const schedule = makeScheduleFromHours(hours);

        const sentOnCommand = false;

        const planFromTime = msg.payload.time ? DateTime.fromISO(msg.payload.time) : DateTime.now();

        // Prepare output
        let output1 = null;
        let output2 = null;
        let output3 = {
          payload: {
            schedule,
            hours,
            source: node.name,
            config,
            sentOnCommand,
            time: planFromTime.toISO(),
            version,
            strategyNodeId: node.id,
          },
        };

        // Find current output, and set output (if configured to do)
        const pastSchedule = schedule.filter((entry) => DateTime.fromISO(entry.time) <= planFromTime);

        const sendNow = !!node.sendCurrentValueWhenRescheduling && pastSchedule.length > 0 && !sentOnCommand;
        const currentValue = pastSchedule[pastSchedule.length - 1]?.value;
        if (sendNow || !!msg.payload.commands?.sendOutput) {
          output1 = currentValue ? { payload: true } : null;
          output2 = currentValue ? null : { payload: false };
        }
        output3.payload.current = currentValue;

        // Send output
        node.send([output1, output2, output3]);

        // Run schedule
        clearTimeout(node.schedulingTimeout);
        node.schedulingTimeout = runSchedule(node, schedule, planFromTime, sendNow);
      }, node.schedulingDelay);
    });
  }
  RED.nodes.registerType("ps-schedule-merger", ScheduleMerger);
};

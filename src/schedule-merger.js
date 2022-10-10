const { mergeSchedules, saveSchedule, validateSchedule } = require("./schedule-merger-functions.js");
const { makeScheduleFromHours } = require("./utils.js");
const { version } = require("../package.json");

module.exports = function (RED) {
  function ScheduleMerger(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const originalConfig = {
      logicFunction: config.logicFunction,
      sendCurrentValueWhenRescheduling: config.sendCurrentValueWhenRescheduling,
      contextStorage: config.contextStorage || "default",
    };
    node.context().set("config", originalConfig);
    node.contextStorage = originalConfig.contextStorage;

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      const validationError = validateSchedule(msg);
      if (validationError) {
        node.warn(validationError);
        node.status({ fill: "red", shape: "dot", text: validationError });
        return;
      }
      saveSchedule(node, msg);
      const resultingHours = mergeSchedules(node, "OR");
      const schedule = makeScheduleFromHours(resultingHours);

      // Prepare output
      let output1 = null;
      let output2 = null;
      let output3 = {
        payload: {
          schedule,
          hours: resultingHours,
          source: node.name,
          config: originalConfig,
          sentOnCommand: false,
          time: resultingHours[0].start,
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

      // Delete old data
      deleteSavedScheduleBefore(node, dateDayBefore);

      // Send output
      node.send([output1, output2, output3]);

      // Run schedule
      node.schedulingTimeout = runSchedule(node, plan.schedule, planFromTime, sendNow);

      runSchedule(node, resultingSchedule); // TODO: make
    });
  }
  RED.nodes.registerType("ps-schedule-merger", ScheduleMerger);
};

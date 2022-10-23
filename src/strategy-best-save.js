const { getEffectiveConfig, getSavings, msgHasConfig, msgHasPriceData, saveOriginalConfig } = require("./utils");
const { handleStrategyInput } = require("./handle-input");
const mostSavedStrategy = require("./strategy-best-save-functions");
const { handleOutput } = require("./handle-output");
const { DateTime } = require("luxon");

module.exports = function (RED) {
  function StrategyBestSaveNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    saveOriginalConfig(node, {
      maxHoursToSaveInSequence: config.maxHoursToSaveInSequence,
      minHoursOnAfterMaxSequenceSaved: config.minHoursOnAfterMaxSequenceSaved,
      minSaving: parseFloat(config.minSaving),
      sendCurrentValueWhenRescheduling: config.sendCurrentValueWhenRescheduling,
      outputIfNoSchedule: config.outputIfNoSchedule === "true",
      contextStorage: config.contextStorage || "default",
    });

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      const config = getEffectiveConfig(node, msg);
      const { plan, commands } = handleStrategyInput(node, msg, config, doPlanning, getSavings);
      const outputCommands = {
        sendOutput: msgHasConfig(msg) || msgHasPriceData(msg) ? commands.sendOutput !== false : !!commands.sendOutput,
        sendSchedule:
          msgHasConfig(msg) || msgHasPriceData(msg) ? commands.sendSchedule !== false : !!commands.sendSchedule,
        runSchedule: true,
        sentOnCommand: !!commands.sendSchedule,
      };
      if (plan || commands) {
        const planFromTime = msg.payload.time ? DateTime.fromISO(msg.payload.time) : DateTime.now();
        handleOutput(node, config, plan, outputCommands, planFromTime);
      }
    });
  }
  RED.nodes.registerType("ps-strategy-best-save", StrategyBestSaveNode);
};

function doPlanning(node, priceData) {
  const values = priceData.map((d) => d.value);
  const onOff = mostSavedStrategy.calculate(
    values,
    node.maxHoursToSaveInSequence,
    node.minHoursOnAfterMaxSequenceSaved,
    node.minSaving
  );
  return onOff;
}

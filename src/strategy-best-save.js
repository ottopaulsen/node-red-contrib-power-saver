const { getSavings, saveOriginalConfig } = require("./utils");
const { handleStrategyInput } = require("./handle-input");
const mostSavedStrategy = require("./strategy-best-save-functions");

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
      handleStrategyInput(node, msg, doPlanning, getSavings);
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

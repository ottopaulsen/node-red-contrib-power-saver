const { booleanConfig, getSavings, saveOriginalConfig } = require("./utils");
const mostSavedStrategy = require("./strategy-best-save-functions");
const { strategyOnInput } = require("./strategy-functions");

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
      outputIfNoSchedule: booleanConfig(config.outputIfNoSchedule),
      contextStorage: config.contextStorage || "default",
    });

    node.on("close", function () {
      const node = this;
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      const node = this;
      strategyOnInput(node, msg, doPlanning, getSavings);
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

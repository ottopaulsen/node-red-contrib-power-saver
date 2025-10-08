const { booleanConfig, fixOutputValues, getSavings, saveOriginalConfig } = require("./utils");
const mostSavedStrategy = require("./strategy-best-save-functions");
const { strategyOnInput } = require("./strategy-functions");

module.exports = function (RED) {
  function StrategyBestSaveNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const validConfig = {
      contextStorage: config.contextStorage || "default",
      maxMinutesOff: config.maxMinutesOff,
      minMinutesOff: config.minMinutesOff,
      recoveryPercentage: config.recoveryPercentage,
      recoveryMaxMinutes: config.recoveryMaxMinutes,
      minSaving: parseFloat(config.minSaving),
      outputIfNoSchedule: booleanConfig(config.outputIfNoSchedule),
      outputValueForOn: config.outputValueForOn || true,
      outputValueForOff: config.outputValueForOff || false,
      outputValueForOntype: config.outputValueForOntype || "bool",
      outputValueForOfftype: config.outputValueForOfftype || "bool",
      override: "auto",
      sendCurrentValueWhenRescheduling: config.sendCurrentValueWhenRescheduling,
    };

    fixOutputValues(validConfig);
    saveOriginalConfig(node, validConfig);

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      strategyOnInput(node, msg, doPlanning, getSavings);
    });
  }
  RED.nodes.registerType("ps-strategy-best-save", StrategyBestSaveNode);
};

function doPlanning(node, priceData) {
  const values = priceData.map((d) => d.value);
  const onOff = mostSavedStrategy.calculate(
    values,
    node.maxMinutesOff,
    node.minMinutesOff,
    node.recoveryPercentage,
    node.recoveryMaxMinutes,
    node.minSaving
  );
  return onOff;
}

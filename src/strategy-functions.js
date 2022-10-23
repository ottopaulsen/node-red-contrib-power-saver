const { DateTime } = require("luxon");
const { getEffectiveConfig } = require("./utils");
const { handleStrategyInput } = require("./handle-input");
const { handleOutput, shallSendOutput, strategyShallSendSchedule } = require("./handle-output");

function strategyOnInput(node, msg, doPlanning, calcSavings) {
  const config = getEffectiveConfig(node, msg);
  const { plan, commands } = handleStrategyInput(node, msg, config, doPlanning, calcSavings);
  const outputCommands = {
    sendOutput: shallSendOutput(msg, commands),
    sendSchedule: strategyShallSendSchedule(msg, commands),
    runSchedule: commands.runSchedule !== false,
    sentOnCommand: !!commands.sendSchedule,
  };
  if (plan) {
    const planFromTime = msg.payload.time ? DateTime.fromISO(msg.payload.time) : DateTime.now();
    handleOutput(node, config, plan, outputCommands, planFromTime);
  }
}

module.exports = { strategyOnInput };

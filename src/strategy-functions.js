const { DateTime } = require("luxon");
const { getEffectiveConfig, getOutputForTime } = require("./utils");
const { handleStrategyInput } = require("./handle-input");
const { handleOutput, shallSendOutput, strategyShallSendSchedule } = require("./handle-output");

function strategyOnInput(node, msg, doPlanning, calcSavings) {
  const config = getEffectiveConfig(node, msg);
  const { plan, commands } = handleStrategyInput(node, msg, config, doPlanning, calcSavings);
  if (plan) {
    const planFromTime = msg.payload.time ? DateTime.fromISO(msg.payload.time) : DateTime.now();
    const currentOutput = node.context().get("currentOutput");
    const plannedOutputNow = getOutputForTime(plan.schedule, planFromTime, node.outputIfNoSchedule);
    const outputCommands = {
      sendOutput: shallSendOutput(
        msg,
        commands,
        currentOutput,
        plannedOutputNow,
        node.sendCurrentValueWhenRescheduling
      ),
      sendSchedule: strategyShallSendSchedule(msg, commands),
      runSchedule: commands.replan !== false,
    };
    handleOutput(node, config, plan, outputCommands, planFromTime);
  }
}

module.exports = { strategyOnInput };

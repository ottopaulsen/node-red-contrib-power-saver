const { DateTime } = require("luxon");
const { getEffectiveConfig, getOutputForTime } = require("./utils");
const { handleStrategyInput } = require("./handle-input");
const { handleOutput, shallSendOutput, strategyShallSendSchedule } = require("./handle-output");

function strategyOnInput(node, msg, doPlanning, calcSavings) {
  if (msg.payload?.name && msg.payload.name !== node.name) {
    // If payload.name is set, and does not match this nodes name, discard message
    return;
  }
  const config = getEffectiveConfig(node, msg);
  const { plan, commands } = handleStrategyInput(node, msg, config, doPlanning, calcSavings);
  if (plan) {
    const planFromTime = msg.payload.time ? DateTime.fromISO(msg.payload.time) : DateTime.now();
    const currentOutput = node.context().get("currentOutput", node.contextStorage);
    const plannedOutputNow =
      node.override === "auto"
        ? getOutputForTime(plan.schedule, planFromTime, node.outputIfNoSchedule)
        : node.override === "on";
    const outputCommands = {
      sendOutput: shallSendOutput(
        msg,
        commands,
        currentOutput,
        plannedOutputNow,
        node.sendCurrentValueWhenRescheduling
      ),
      sendSchedule: strategyShallSendSchedule(msg, commands),
      runSchedule: commands.replan !== false && config.override === "auto",
    };
    handleOutput(node, config, plan, outputCommands, planFromTime);
  }
}

module.exports = { strategyOnInput };

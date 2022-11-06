const { DateTime } = require("luxon");
const { version } = require("../package.json");
const { msgHasConfig, msgHasPriceData } = require("./utils.js");

function handleOutput(node, config, plan, outputCommands, planFromTime) {
  /*
      The plan received here must contain previous schedule so current value can be sent.

      Functions to perform is in the outputCommands object:
        sendOutput: Send current output on either output 1 or 2 (on or off).
        sendSchedule: Send current schedule on output 3.
        runSchedule: Reset schedule and run it for remaining plan.

      TODO (otto): Expand outputCommands with "override", that can be either 
                   on/true, off/false or none/null.
  */

  // Prepare output
  let output1 = null;
  let output2 = null;
  let output3 = {
    payload: {
      schedule: plan.schedule,
      hours: plan.hours,
      source: plan.source,
      config,
      time: planFromTime.toISO(),
      version,
      strategyNodeId: node.id,
    },
  };

  // Find current output, and set output (if configured to do)
  const pastSchedule = plan.schedule.filter((entry) => DateTime.fromISO(entry.time) <= planFromTime);
  const currentValue = pastSchedule[pastSchedule.length - 1]?.value;

  output1 = currentValue ? { payload: config.outputValueForOn } : null;
  output2 = currentValue ? null : { payload: config.outputValueForOn };
  output3.payload.current = currentValue;

  // Send output
  if (outputCommands.sendOutput) {
    node.send([output1, output2, null]);
  }

  // Send schedule
  if (outputCommands.sendSchedule) {
    node.send([null, null, output3]);
  }

  // Run schedule
  if (outputCommands.runSchedule) {
    clearTimeout(node.schedulingTimeout);
    node.schedulingTimeout = runSchedule(node, plan.schedule, planFromTime, true);
  }
}

function sendSwitch(node, onOff) {
  const output1 = onOff ? { payload: true } : null;
  const output2 = onOff ? null : { payload: false };
  node.send([output1, output2, null]);
}

function runSchedule(node, schedule, time, currentSent = false) {
  let remainingSchedule = schedule.filter((entry) => {
    return DateTime.fromISO(entry.time) > time;
  });
  if (remainingSchedule.length > 0) {
    const entry = remainingSchedule[0];
    const nextTime = DateTime.fromISO(entry.time);
    const wait = nextTime - time;
    const onOff = entry.value ? "on" : "off";
    node.log("Switching " + onOff + " in " + wait + " milliseconds");
    const statusMessage = `${remainingSchedule.length} changes - ${
      remainingSchedule[0].value ? "on" : "off"
    } at ${nextTime.toLocaleString(DateTime.TIME_SIMPLE)}`;
    node.status({ fill: "green", shape: "dot", text: statusMessage });
    return setTimeout(() => {
      sendSwitch(node, entry.value);
      node.schedulingTimeout = runSchedule(node, remainingSchedule, nextTime);
    }, wait);
  } else {
    const message = "No schedule";
    node.warn(message);
    node.status({ fill: "yellow", shape: "dot", text: message });
    if (!currentSent) {
      sendSwitch(node, node.outputIfNoSchedule);
    }
  }
}

function shallSendOutput(msg, commands) {
  if (commands.sendOutput !== undefined) {
    return commands.sendOutput;
  }
  return msgHasConfig(msg) || msgHasPriceData(msg) || commands.replan;
}

function strategyShallSendSchedule(msg, commands) {
  if (commands.sendSchedule !== undefined) {
    return commands.sendSchedule;
  }
  return msgHasConfig(msg) || msgHasPriceData(msg) || commands.replan;
}

module.exports = {
  handleOutput,
  shallSendOutput,
  strategyShallSendSchedule,
};

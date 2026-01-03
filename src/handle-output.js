const { DateTime } = require("luxon");
const { version } = require("../package.json");
const { getOutputForTime, msgHasConfig, msgHasPriceData } = require("./utils.js");

function handleOutput(node, config, plan, outputCommands, planFromTime) {
  /*
      The plan received here must contain previous schedule so current value can be sent.

      Functions to perform is in the outputCommands object:
        sendOutput: Send current output on either output 1 or 2 (on or off).
        sendSchedule: Send current schedule on output 3.
        runSchedule: Reset schedule and run it for remaining plan.

  */

  // Clear status
  node.status({});

  // Prepare output
  let output3 = {
    payload: {
      schedule: plan.schedule,
      minutes: collapseMinutes(plan.minutes),
      source: plan.source,
      config,
      time: planFromTime.toISO(),
      version,
      strategyNodeId: node.id,
    },
  };

  // Find current output, and set output (if configured to do)
  const currentValue =
    node.override === "auto"
      ? getOutputForTime(plan.schedule, planFromTime, node.outputIfNoSchedule)
      : node.override === "on";
  output3.payload.current = currentValue;

  // Send output
  if (outputCommands.sendOutput) {
    sendSwitch(node, currentValue);
  }

  // Send schedule
  if (outputCommands.sendSchedule) {
    node.send([null, null, output3]);
  }

  // Run schedule
  clearTimeout(node.schedulingTimeout);
  if (outputCommands.runSchedule) {
    node.schedulingTimeout = runSchedule(node, plan.schedule, planFromTime, true);
  }

  // Set status if override
  if (config.override !== "auto") {
    node.status({ fill: "yellow", shape: "dot", text: "Override " + config.override });
  }
}

function sendSwitch(node, onOff) {
  const output1 = onOff ? { payload: node.outputValueForOn } : null;
  const output2 = onOff ? null : { payload: node.outputValueForOff };
  node.send([output1, output2, null]);
  node.context().set("currentOutput", onOff, node.contextStorage);
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
    const statusMessage = `${remainingSchedule.length} changes - ${
      remainingSchedule[0].value ? "on" : "off"
    } at ${nextTime.toFormat("HH:mm")}`;
    node.status({ fill: "green", shape: "dot", text: statusMessage });
    return setTimeout(() => {
      sendSwitch(node, entry.value);
      node.schedulingTimeout = runSchedule(node, remainingSchedule, nextTime);
    }, wait);
  } else {
    const message = "No schedule";
    // node.warn(message);
    node.status({ fill: "yellow", shape: "dot", text: message });
    if (!currentSent) {
      sendSwitch(node, node.outputIfNoSchedule);
    }
  }
}

function shallSendOutput(msg, commands, currentOutput, plannedOutputNow, sendCurrentValueWhenRescheduling) {
  if (commands.sendOutput !== undefined) {
    return commands.sendOutput;
  }
  if (msgHasConfig(msg) || msgHasPriceData(msg) || commands.replan) {
    return sendCurrentValueWhenRescheduling ? true : currentOutput !== plannedOutputNow;
  }
  return false;
}

function strategyShallSendSchedule(msg, commands) {
  if (commands.sendSchedule !== undefined) {
    return commands.sendSchedule;
  }
  return msgHasConfig(msg) || msgHasPriceData(msg) || commands.replan;
}

function collapseMinutes(minutes) {
  function itemsEqual(a, b) {
    return a.price === b.price && a.onOff === b.onOff && a.saving === b.saving;
  }




  if (!Array.isArray(minutes) || minutes.length === 0) {
    return [];
  }

  const result = [];
  let currentValue = minutes[0];
  let count = 1;
  let startIndex = 0;

  for (let i = 1; i < minutes.length; i++) {
    if (itemsEqual(minutes[i], currentValue)) {
      count++;
    } else {
      result.push({ ...currentValue, count, startIndex });
      currentValue = minutes[i];
      count = 1;
      startIndex = i;
    }
  }

  result.push({ ...currentValue, count, startIndex });

  return result;



}

module.exports = {
  handleOutput,
  shallSendOutput,
  strategyShallSendSchedule,
};

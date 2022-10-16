const { DateTime } = require("luxon");
const { version } = require("../package.json");

function handleOutput(node, config, plan, commands, planFromTime) {
  const sentOnCommand = !!commands.sendSchedule;

  // Prepare output
  let output1 = null;
  let output2 = null;
  let output3 = {
    payload: {
      schedule: plan.schedule,
      hours: plan.hours,
      source: plan.source,
      config,
      sentOnCommand,
      time: planFromTime.toISO(),
      version,
      strategyNodeId: node.id,
    },
  };

  // Find current output, and set output (if configured to do)
  const pastSchedule = plan.schedule.filter((entry) => DateTime.fromISO(entry.time) <= planFromTime);

  const sendNow = !!node.sendCurrentValueWhenRescheduling && pastSchedule.length > 0 && !sentOnCommand;
  const currentValue = pastSchedule[pastSchedule.length - 1]?.value;
  if (sendNow || commands.sendOutput) {
    output1 = currentValue ? { payload: true } : null;
    output2 = currentValue ? null : { payload: false };
  }
  output3.payload.current = currentValue;

  // Send output
  node.send([output1, output2, output3]);

  // Run schedule
  clearTimeout(node.schedulingTimeout);
  node.schedulingTimeout = runSchedule(node, plan.schedule, planFromTime, sendNow);
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

module.exports = {
  handleOutput,
};

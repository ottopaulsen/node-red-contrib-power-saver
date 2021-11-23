const { getEffectiveConfig, validateInput } = require("./strategy-utils");
const { extractPlanForDate } = require("./utils");
const { DateTime } = require("luxon");

function handleStrategyInput(node, msg, doPlanning) {
  node.schedulingTimeout = null;

  const effectiveConfig = getEffectiveConfig(node, msg);
  if (!validateInput(node, msg)) {
    return;
  }
  const priceData = msg.payload.priceData;
  const planFromTime = msg.payload.time ?? DateTime.now();

  // Store config variables in node
  Object.keys(effectiveConfig).forEach((key) => (node[key] = effectiveConfig[key]));

  clearTimeout(node.schedulingTimeout);

  const dates = [...new Set(priceData.map((v) => DateTime.fromISO(v.start).toISODate()))];

  // Load data from day before
  const dateToday = DateTime.fromISO(dates[0]);
  const dateDayBefore = DateTime.fromISO(dates[0]).plus({ days: -1 });

  // Make plan
  const plan = doPlanning(node, effectiveConfig, priceData, planFromTime, dateDayBefore, dateToday);

  // Save schedule
  node.context().set("lastPlan", plan);
  dates.forEach((d) => saveDayData(node, d, extractPlanForDate(plan, d)));

  // Prepare output
  let output1 = null;
  let output2 = null;
  let output3 = {
    payload: {
      schedule: plan.schedule,
      hours: plan.hours,
      source: priceData.source,
      config: effectiveConfig,
    },
  };

  // Find current output, and set output (if configured to do)
  const pastSchedule = plan.schedule.filter((entry) => DateTime.fromISO(entry.time) <= planFromTime);

  if (node.sendCurrentValueWhenRescheduling && pastSchedule.length > 0) {
    const currentValue = pastSchedule[pastSchedule.length - 1].value;
    output1 = currentValue ? { payload: true } : null;
    output2 = currentValue ? null : { payload: false };
  }

  // Delete old data
  deleteSavedScheduleBefore(node, dateDayBefore);

  // Send output
  node.send([output1, output2, output3]);

  // Run schedule
  node.schedulingTimeout = runSchedule(node, plan.schedule, planFromTime);
}

function runSchedule(node, schedule, time) {
  let currentTime = time;
  let remainingSchedule = schedule.filter((entry) => {
    console.log("entry.time:", entry.time);
    console.log("curr. time:", time);
    return DateTime.fromISO(entry.time) > DateTime.fromISO(time);
  });
  console.log("remainingSchedule", remainingSchedule);
  if (remainingSchedule.length > 0) {
    const entry = remainingSchedule[0];
    const nextTime = DateTime.fromISO(entry.time);
    const wait = nextTime - currentTime;
    const onOff = entry.value ? "on" : "off";
    node.log("Switching " + onOff + " in " + wait + " milliseconds");
    const statusMessage = `Scheduled ${remainingSchedule.length} changes. Next: ${
      remainingSchedule[0].value ? "on" : "off"
    }`;
    node.status({ fill: "green", shape: "dot", text: statusMessage });
    return setTimeout(() => {
      sendSwitch(node, entry.value);
      node.schedulingTimeout = runSchedule(node, remainingSchedule, nextTime);
    }, wait);
  } else {
    const message = "No schedule";
    node.warn(message);
    node.status({ fill: "red", shape: "dot", text: message });
    sendSwitch(node, node.outputIfNoSchedule);
  }
}

function deleteSavedScheduleBefore(node, day) {
  let date = day;
  do {
    date = date.plus({ days: -1 });
    data = node.context().get(date.toISO());
  } while (data);
}

function saveDayData(node, date, plan) {
  node.context().set(date, plan);
}

function sendSwitch(node, onOff) {
  const output1 = onOff ? { payload: true } : null;
  const output2 = onOff ? null : { payload: false };
  node.send([output1, output2, null]);
}

module.exports = {
  handleStrategyInput,
};

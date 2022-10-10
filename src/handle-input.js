const { extractPlanForDate, getEffectiveConfig, loadDayData, makeSchedule, validationFailure } = require("./utils");
const { DateTime } = require("luxon");
const { version } = require("../package.json");

function handleStrategyInput(node, msg, doPlanning, calcSavings) {
  const effectiveConfig = getEffectiveConfig(node, msg);
  // Store config variables in node
  Object.keys(effectiveConfig).forEach((key) => (node[key] = effectiveConfig[key]));

  if (!validateInput(node, msg)) {
    return;
  }

  if (msg.payload.commands && !anyLegalCommands(msg.payload.commands)) {
    const message = "Illegal command";
    node.warn(message);
    node.status({ fill: "yellow", shape: "dot", text: message });
    return;
  }
  if (msg.payload.commands && msg.payload.commands.reset) {
    node.warn("Resetting node context by command");
    // Reset all saved data
    node
      .context()
      .set(["lastPlan", "lastPriceData", "lastSource"], [undefined, undefined, undefined], node.contextStorage);
    deleteSavedScheduleBefore(node, DateTime.now().plus({ days: 2 }), 100);
  }

  let { priceData, source } = getPriceData(node, msg);
  if (!priceData) {
    // Use last saved price data
    priceData = node.context().get("lastPriceData", node.contextStorage);
    source = node.context().get("lastSource", node.contextStorage);
    const message = "Using saved prices";
    node.warn(message);
    node.status({ fill: "green", shape: "ring", text: message });
  }
  if (!priceData) {
    const message = "No price data";
    node.warn(message);
    node.status({ fill: "yellow", shape: "dot", text: message });
    return;
  }
  const planFromTime = msg.payload.time ? DateTime.fromISO(msg.payload.time) : DateTime.now();

  clearTimeout(node.schedulingTimeout);

  const dates = [...new Set(priceData.map((v) => DateTime.fromISO(v.start).toISODate()))];

  // Load data from day before
  const dateToday = DateTime.fromISO(dates[0]);
  const dateDayBefore = DateTime.fromISO(dates[0]).plus({ days: -1 });

  const dataJustBefore = loadDataJustBefore(node, dateDayBefore);

  // Make plan
  const onOff = doPlanning(node, effectiveConfig, priceData, planFromTime, dateDayBefore, dateToday, dataJustBefore);

  const startTimes = priceData.map((d) => d.start);
  const onOffBefore = dataJustBefore.hours.map((h) => h.onOff);
  const lastValueDayBefore = onOffBefore[onOffBefore.length - 1];
  const values = priceData.map((d) => d.value);

  const schedule = makeSchedule(onOff, startTimes, lastValueDayBefore);
  const savings = calcSavings(values, onOff);
  const hours = values.map((v, i) => ({
    price: v,
    onOff: onOff[i],
    start: startTimes[i],
    saving: savings[i],
  }));

  const lastPlanHours = node.context().get("lastPlan", node.contextStorage)?.hours ?? [];

  const includeFromLastPlanHours = lastPlanHours.filter(
    (h) => h.start < hours[0].start && h.start >= priceData[0].start
  );
  adjustSavingsPassedHours(hours, includeFromLastPlanHours);
  hours.splice(0, 0, ...includeFromLastPlanHours);

  const plan = {
    hours,
    schedule,
  };

  // Save schedule
  node.context().set("lastPlan", plan, node.contextStorage);
  dates.forEach((d) => saveDayData(node, d, extractPlanForDate(plan, d)));

  const sentOnCommand = !!msg.payload.commands?.sendSchedule;

  // Prepare output
  let output1 = null;
  let output2 = null;
  let output3 = {
    payload: {
      schedule,
      hours,
      source,
      config: effectiveConfig,
      sentOnCommand,
      time: planFromTime.toISO(),
      version,
      strategyNodeId: node.id,
    },
  };

  // Find current output, and set output (if configured to do)
  const pastSchedule = schedule.filter((entry) => DateTime.fromISO(entry.time) <= planFromTime);

  const sendNow = !!node.sendCurrentValueWhenRescheduling && pastSchedule.length > 0 && !sentOnCommand;
  const currentValue = pastSchedule[pastSchedule.length - 1]?.value;
  if (sendNow || !!msg.payload.commands?.sendOutput) {
    output1 = currentValue ? { payload: true } : null;
    output2 = currentValue ? null : { payload: false };
  }
  output3.payload.current = currentValue;

  // Delete old data
  deleteSavedScheduleBefore(node, dateDayBefore);

  // Send output
  node.send([output1, output2, output3]);

  // Run schedule
  node.schedulingTimeout = runSchedule(node, schedule, planFromTime, sendNow);
}

function adjustSavingsPassedHours(hours, includeFromLastPlanHours) {
  const firstOnIndex = hours.findIndex((h) => h.onOff);
  if (firstOnIndex < 0) {
    return;
  }
  const nextOnValue = hours[firstOnIndex].price;
  let adjustIndex = includeFromLastPlanHours.length - 1;
  while (adjustIndex >= 0 && !includeFromLastPlanHours[adjustIndex].onOff) {
    includeFromLastPlanHours[adjustIndex].saving = getDiff(includeFromLastPlanHours[adjustIndex].price, nextOnValue);
    adjustIndex--;
  }
}

function loadDataJustBefore(node, dateDayBefore) {
  const dataDayBefore = loadDayData(node, dateDayBefore);
  return {
    schedule: [...dataDayBefore.schedule],
    hours: [...dataDayBefore.hours],
  };
}

function getPriceData(node, msg) {
  const isConfigMsg = !!msg?.payload?.config;
  const isCommandMsg = !!msg?.payload?.commands;
  const isPriceMsg = !!msg?.payload?.priceData;
  if ((isConfigMsg || isCommandMsg) && !isPriceMsg) {
    const priceData = node.context().get("lastPriceData", node.contextStorage);
    const source = node.context().get("lastSource", node.contextStorage);
    return { priceData, source };
  }
  const priceData = msg.payload.priceData;
  const source = msg.payload.source;
  node.context().set("lastPriceData", priceData, node.contextStorage);
  node.context().set("lastSource", source, node.contextStorage);
  return { priceData, source };
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
    node.status({ fill: "red", shape: "dot", text: message });
    if (!currentSent) {
      sendSwitch(node, node.outputIfNoSchedule);
    }
  }
}

function deleteSavedScheduleBefore(node, day, checkDays = 0) {
  let date = day;
  let data = null;
  let count = 0;
  do {
    date = date.plus({ days: -1 });
    data = node.context().get(date.toISODate(), node.contextStorage);
    node.context().set(date.toISODate(), undefined, node.contextStorage);
    count++;
  } while (data !== undefined || count <= checkDays);
}

function saveDayData(node, date, plan) {
  node.context().set(date, plan, node.contextStorage);
}

function sendSwitch(node, onOff) {
  const output1 = onOff ? { payload: true } : null;
  const output2 = onOff ? null : { payload: false };
  node.send([output1, output2, null]);
}

function validateInput(node, msg) {
  if (!msg.payload) {
    validationFailure(node, "No payload");
    return;
  }
  if (typeof msg.payload !== "object") {
    validationFailure(node, "Payload is not an object");
    return;
  }
  if (msg.payload.config !== undefined) {
    return true; // Got config msg
  }
  if (msg.payload.commands !== undefined) {
    return true; // Got command msg
  }
  if (msg.payload.priceData === undefined) {
    validationFailure(node, "Payload is missing priceData");
    return;
  }
  if (msg.payload.priceData.length === undefined) {
    validationFailure(node, "Illegal priceData in payload. Did you use the receive-price node?", "Illegal payload");
    return;
  }
  if (msg.payload.priceData.length === 0) {
    validationFailure(node, "priceData is empty");
    return;
  }
  msg.payload.priceData.forEach((h) => {
    if (!h.start || !h.value) {
      validationFailure(node, "Malformed entries in priceData. All entries must contain start and value.");
      return;
    }
  });
  return true;
}

function anyLegalCommands(commands) {
  return ["reset", "replan", "sendOutput", "sendSchedule"].some((v) => commands.hasOwnProperty(v));
}

module.exports = {
  handleStrategyInput,
  validateInput,
};

const { extractPlanForDate, getEffectiveConfig, loadDayData, makeSchedule, validationFailure } = require("./utils");
const { runSchedule } = require("./handle-output");
const { DateTime } = require("luxon");
const { version } = require("../package.json");

function handleStrategyInput(node, msg, doPlanning, calcSavings) {
  const config = getEffectiveConfig(node, msg);

  if (!validateInput(node, msg)) {
    return;
  }

  const commands = getCommands(msg);

  if (commands.reset) {
    node.warn("Resetting node context by command");
    // Reset all saved data
    node
      .context()
      .set(["lastPlan", "lastPriceData", "lastSource"], [undefined, undefined, undefined], node.contextStorage);
    deleteSavedScheduleBefore(node, DateTime.now().plus({ days: 2 }), 100);
  }

  let plan = null;

  if (msgHasPriceData(msg) || config.hasChanged) {
    const { priceData, source } = msgHasPriceData(msg) ? getPriceDataFromMessage(msg) : getSavedLastPriceData(node);
    if (msgHasPriceData(msg)) {
      saveLastPriceData(node, priceData, source);
    }

    plan = makePlanFromPriceData(node, priceData, source, doPlanning, calcSavings);
  } else {
    // Load last saved plan
    plan = node.context().get("lastPlan", node.contextStorage);
  }

  // If still no plan?
  if (!plan) {
    const message = "No price data";
    node.warn(message);
    node.status({ fill: "yellow", shape: "dot", text: message });
    return;
  }

  const sentOnCommand = !!commands.sendSchedule;

  const planFromTime = msg.payload.time ? DateTime.fromISO(msg.payload.time) : DateTime.now();

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

function makePlanFromPriceData(node, priceData, source, doPlanning, calcSavings) {
  if (!priceData) {
    return null;
  }

  const dates = [...new Set(priceData.map((v) => DateTime.fromISO(v.start).toISODate()))];

  // Load data from day before
  const dateDayBefore = DateTime.fromISO(dates[0]).plus({ days: -1 });
  const dataDayBefore = loadDataJustBefore(node, dateDayBefore);
  const priceDataDayBefore = dataDayBefore.hours.map((h) => ({ value: h.price, start: h.start }));
  const priceDataWithDayBefore = [...priceDataDayBefore, ...priceData];

  // Make plan
  const startTimes = priceDataWithDayBefore.map((d) => d.start);
  const prices = priceDataWithDayBefore.map((d) => d.value);
  const onOff = doPlanning(node, priceDataWithDayBefore);
  const savings = calcSavings(prices, onOff);
  const hours = startTimes.map((v, i) => ({
    start: startTimes[i],
    price: prices[i],
    onOff: onOff[i],
    saving: savings[i],
  }));
  const schedule = makeSchedule(onOff, startTimes);

  plan = {
    hours,
    schedule,
    source,
  };

  // Save schedule
  node.context().set("lastPlan", plan, node.contextStorage);
  dates.forEach((d) => saveDayData(node, d, extractPlanForDate(plan, d)));

  // Delete old data
  deleteSavedScheduleBefore(node, dateDayBefore);

  return plan;
}

// Commands

function getCommands(msg) {
  const legalCommands = ["reset", "replan", "sendOutput", "sendSchedule"];
  const commands = { legal: true };
  if (!msg?.payload?.commands) {
    return commands;
  }
  legalCommands.forEach((c) => {
    commands[c] = msg.payload.commands[c];
  });
  return commands;
}

// Price data

function msgHasPriceData(msg) {
  return !!msg?.payload?.priceData;
}

function getPriceDataFromMessage(msg) {
  const priceData = msg.payload.priceData;
  const source = msg.payload.source;
  return { priceData, source };
}

function getSavedLastPriceData(node) {
  const priceData = node.context().get("lastPriceData", node.contextStorage);
  const source = node.context().get("lastSource", node.contextStorage);
  return { priceData, source };
}

function saveLastPriceData(node, priceData, source) {
  node.context().set("lastPriceData", priceData, node.contextStorage);
  node.context().set("lastSource", source, node.contextStorage);
}

// Other

function loadDataJustBefore(node, dateDayBefore) {
  const dataDayBefore = loadDayData(node, dateDayBefore);
  return {
    schedule: [...dataDayBefore.schedule],
    hours: [...dataDayBefore.hours],
  };
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

module.exports = {
  handleStrategyInput,
  validateInput,
};

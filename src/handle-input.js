const { extractPlanForDate, loadDayData, makeSchedule, msgHasPriceData, validationFailure } = require("./utils");
const { DateTime } = require("luxon");

function handleStrategyInput(node, msg, config, doPlanning, calcSavings) {
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

  const plan =
    msgHasPriceData(msg) || config.hasChanged
      ? makePlanFromPriceData(node, msg, config, doPlanning, calcSavings)
      : node.context().get("lastPlan", node.contextStorage);

  // If still no plan?
  if (!plan) {
    const message = "No price data";
    node.warn(message);
    node.status({ fill: "yellow", shape: "dot", text: message });
    return;
  }

  return { plan, commands };
}

function makePlanFromPriceData(node, msg, config, doPlanning, calcSavings) {
  const { priceData, source } = msgHasPriceData(msg) ? getPriceDataFromMessage(msg) : getSavedLastPriceData(node);
  if (msgHasPriceData(msg)) {
    saveLastPriceData(node, priceData, source);
  }

  if (!priceData) {
    return null;
  }

  const dates = [...new Set(priceData.map((v) => DateTime.fromISO(v.start).toISODate()))];
  const endTime = priceData[priceData.length - 1].end;

  // Load data from day before
  const dateDayBefore = DateTime.fromISO(dates[0]).plus({ days: -1 });
  const dataDayBefore = loadDataJustBefore(node, dateDayBefore);
  const priceDataDayBefore = dataDayBefore.minutes.map((h) => ({ value: h.price, start: h.start }));
  const priceDataWithDayBefore = [...priceDataDayBefore, ...priceData];

  // Make plan
  // const startTimes = priceDataWithDayBefore.map((d) => d.start);
  // const prices = priceDataWithDayBefore.map((d) => d.value);
  const priceDatePerMinute = priceDataWithDayBefore.flatMap((d, i) => {
    const res = [];
    const start = DateTime.fromISO(d.start);
    const end = DateTime.fromISO(d.end ?? priceDataWithDayBefore[i + 1].start)
    if(!end) {
      console.error("End time is missing for price data entry", d);
      return res
    }
    let minute = start
    while (minute < end) {
      res.push({ start: minute.toISO(), value: d.value });
      minute = minute.plus({ minutes: 1 });
    }
    return res;
  });
  const startTimes = priceDatePerMinute.map((d) => d.start);
  const prices = priceDatePerMinute.map((d) => d.value);


  const onOff = doPlanning(node, priceDatePerMinute);
  const savings = calcSavings(prices, onOff);
  const minutes = startTimes.map((v, i) => ({
    start: startTimes[i],
    price: prices[i],
    onOff: onOff[i],
    saving: savings[i],
  }));
  const schedule = makeSchedule(onOff, startTimes, endTime);
  addLastSwitchIfNoSchedule(schedule, minutes, config);

  plan = {
    minutes,
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
  if (msg.payload?.config?.override === "auto") {
    commands.runSchedule = true;
  }
  if (!msg?.payload?.commands) {
    return commands;
  }
  legalCommands.forEach((c) => {
    commands[c] = msg.payload.commands[c];
  });
  return commands;
}

// Price data

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

function addLastSwitchIfNoSchedule(schedule, minutes, config) {
  if (!minutes.length) {
    return;
  }
  if (schedule.length > 0 && schedule[schedule.length - 1].value === config.outputIfNoSchedule) {
    return;
  }
  const nexMinute = DateTime.fromISO(minutes[minutes.length - 1].start).plus({ minutes: 1 });
  schedule.push({ time: nexMinute.toISO(), value: config.outputIfNoSchedule, countMinutes: null });
}

function loadDataJustBefore(node, dateDayBefore) {
  const dataDayBefore = loadDayData(node, dateDayBefore);
  return {
    schedule: [...dataDayBefore.schedule],
    minutes: [...dataDayBefore.minutes],
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
    if (!h.start || isNaN(h.value)) {
      validationFailure(node, "Malformed entries in priceData. All entries must contain start and value.");
      return;
    }
  });
  return true;
}

module.exports = {
  addLastSwitchIfNoSchedule,
  getCommands,
  handleStrategyInput,
  validateInput,
};

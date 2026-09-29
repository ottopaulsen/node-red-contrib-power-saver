const {
  addEndToLast,
  extractPlanForDate,
  loadDayData,
  makeSchedule,
  msgHasPriceData,
  validationFailure,
} = require("./utils");
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

  // The last record may have no end: validateInput only requires start and
  // value, and price data can be given to the node directly, without the
  // receive-price node that normally adds it. Infer it from the length of the
  // previous period instead of planning without the last period.
  const numericPriceData = toNumericPriceData(priceData);
  const lastRecord = numericPriceData[numericPriceData.length - 1];
  const priceDataWithEnd = lastRecord.end ? numericPriceData : [...numericPriceData.slice(0, -1), { ...lastRecord }];
  if (!lastRecord.end) {
    addEndToLast(priceDataWithEnd);
  }

  const dates = [...new Set(priceDataWithEnd.map((v) => DateTime.fromISO(v.start).toISODate()))];
  const endTime = priceDataWithEnd[priceDataWithEnd.length - 1].end;

  // Load data from day before
  const dateDayBefore = DateTime.fromISO(dates[0]).plus({ days: -1 });
  const dataDayBefore = loadDataJustBefore(node, dateDayBefore);
  const priceDataDayBefore = dataDayBefore.minutes.map((h) => ({ value: h.price, start: h.start }));
  const priceDataWithDayBefore = [...priceDataDayBefore, ...priceDataWithEnd];

  // Make plan
  // const startTimes = priceDataWithDayBefore.map((d) => d.start);
  // const prices = priceDataWithDayBefore.map((d) => d.value);
  const priceDatePerMinute = priceDataWithDayBefore.flatMap((d, i) => {
    const res = [];
    const start = DateTime.fromISO(d.start);
    // A record without an end lasts until the next one starts.
    const entryEnd = d.end ?? priceDataWithDayBefore[i + 1]?.start;
    if (!entryEnd) {
      node.warn(`End time is missing for the price data entry starting at ${d.start}`);
      return res;
    }
    const end = DateTime.fromISO(entryEnd);
    if (!end.isValid) {
      node.warn(`Illegal end time for the price data entry starting at ${d.start}`);
      return res;
    }
    const zone = start.zone;
    const startMs = start.toMillis();
    const endMs = end.toMillis();
    for (let ms = startMs; ms < endMs; ms += 60000) {
      res.push({ start: DateTime.fromMillis(ms, { zone }).toISO(), value: d.value });
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
  const fullSchedule = makeSchedule(onOff, startTimes, endTime);
  const schedule = trimScheduleToStart(fullSchedule, priceDataWithEnd[0].start);
  addLastSwitchIfNoSchedule(schedule, minutes, config);

  const plan = {
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

function trimScheduleToStart(schedule, startTime) {
  const startDT = DateTime.fromISO(startTime);
  const idx = schedule.findIndex((e) => DateTime.fromISO(e.time) >= startDT);
  if (idx === -1) return schedule;
  const trimmed = schedule.slice(idx);
  if (DateTime.fromISO(trimmed[0].time) > startDT) {
    const initialState = (idx > 0 ? schedule[idx - 1] : schedule[0]).value;
    const countMinutes = DateTime.fromISO(trimmed[0].time).diff(startDT, "minutes").minutes;
    trimmed.unshift({ time: startDT.toISO(), value: initialState, countMinutes });
  }
  return trimmed;
}

function deleteSavedScheduleBefore(node, day, checkDays = 0) {
  let date = day;
  let data;
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
  // A return inside a forEach callback only leaves the callback, so this used
  // to warn about malformed entries and then accept them anyway.
  if (msg.payload.priceData.some((h) => !h.start || !isValidPrice(h.value))) {
    validationFailure(node, "Malformed entries in priceData. All entries must contain start and value.");
    return;
  }
  return true;
}

/**
 * A price is a number, or a string holding one. Price data can be given to the
 * node directly, without the receive-price node, and such flows may well supply
 * the prices as strings, so those are accepted and converted before planning.
 * Anything that is only numeric by coercion - null, booleans, [], "" - is not,
 * and neither are NaN and Infinity.
 */
function isValidPrice(value) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }
  return Number.isFinite(Number(value));
}

/**
 * Return the price data with every value as a number. Strings would otherwise
 * be concatenated rather than added when the plan is calculated.
 */
function toNumericPriceData(priceData) {
  return priceData.map((entry) => (typeof entry.value === "number" ? entry : { ...entry, value: Number(entry.value) }));
}

module.exports = {
  addLastSwitchIfNoSchedule,
  getCommands,
  handleStrategyInput,
  toNumericPriceData,
  validateInput,
};

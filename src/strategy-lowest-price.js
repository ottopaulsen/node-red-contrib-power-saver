const { DateTime } = require("luxon");
const { booleanConfig, calcNullSavings, fixOutputValues, saveOriginalConfig } = require("./utils");
const { getBestContinuous, getBestX } = require("./strategy-lowest-price-functions");
const { strategyOnInput } = require("./strategy-functions");

module.exports = function (RED) {
  function StrategyLowestPriceNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const validConfig = {
      fromTime: config.fromTime,
      toTime: config.toTime,
      hoursOn: parseInt(config.hoursOn),
      maxPrice: config.maxPrice == null || config.maxPrice == "" ? null : parseFloat(config.maxPrice),
      doNotSplit: booleanConfig(config.doNotSplit),
      sendCurrentValueWhenRescheduling: booleanConfig(config.sendCurrentValueWhenRescheduling),
      outputIfNoSchedule: booleanConfig(config.outputIfNoSchedule),
      outputOutsidePeriod: booleanConfig(config.outputOutsidePeriod),
      outputValueForOn: config.outputValueForOn || true,
      outputValueForOff: config.outputValueForOff || false,
      outputValueForOntype: config.outputValueForOntype || "bool",
      outputValueForOfftype: config.outputValueForOfftype || "bool",
      override: "auto",
      contextStorage: config.contextStorage || "default",
    };

    fixOutputValues(validConfig);
    saveOriginalConfig(node, validConfig);

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      strategyOnInput(node, msg, doPlanning, calcNullSavings);
    });
  }
  RED.nodes.registerType("ps-strategy-lowest-price", StrategyLowestPriceNode);
};

function getInterval(priceData) {
  if (priceData.length < 2) {
    return null; // Not enough data to determine interval
  }
  
  const firstTime = DateTime.fromISO(priceData[0].start);
  const secondTime = DateTime.fromISO(priceData[1].start);
  
  // Get the difference in minutes
  const intervalMinutes = secondTime.diff(firstTime, 'minutes').minutes;
  if (isNaN(intervalMinutes) || intervalMinutes >= 60) {
    return 60;;
  }
  return intervalMinutes;
}

function doPlanning(node, priceData) {
  // Extract price values and start times from the price data
  const values = priceData.map((pd) => pd.value);
  const startTimes = priceData.map((pd) => pd.start);

  const intervalMinutes = getInterval(priceData) || 60; // Default to 60 minutes if unable to determine
  const isHourly = intervalMinutes === 60;

  // Parse the time boundaries from node configuration
  const from = parseInt(node.fromTime);
  const to = parseInt(node.toTime);
  
  // Initialize arrays to track period status and boundaries
  const periodStatus = []; // Tracks whether each hour is "Inside", "Outside", "StartMissing", or "EndMissing"
  const startIndexes = []; // Array of starting indexes for valid periods
  const endIndexes = []; // Array of ending indexes for valid periods
  
  // Determine initial status: "Outside" for same-day periods, "StartMissing" for overnight periods
  let currentStatus = from < (to === 0 && to !== from ? 24 : to) ? "Outside" : "StartMissing";
  let hour;
  let minute;
  // Iterate through all time periods to determine status and find period boundaries
  startTimes.forEach((st, i) => {
    let time = DateTime.fromISO(st)
    hour = time.hour;
    minute = time.minute;

    // Special case: Handle when 'to' equals 'from' (24-hour period)
    if (hour === to && to === from && currentStatus === "Inside" && (isHourly ? true : minute === 0)) {
      endIndexes.push(i - 1);
    }
    
    // End of period: When we reach the 'to' hour (and it's not same as 'from')
    if (hour === to && to !== from && i > 0 && (isHourly ? true : minute === 0)) {
      if(currentStatus !== "StartMissing") {
        endIndexes.push(i - 1);
      }
      currentStatus = "Outside";
    }
    
    // Start of period: When we reach the 'from' hour
    if (hour === from && (isHourly ? true : minute === 0)) {
      currentStatus = "Inside";
      startIndexes.push(i);
    }
    
    // Record the current status for this time slot
    periodStatus[i] = currentStatus;
  });
  // Handle incomplete periods at the end of the data
  if (currentStatus === "Inside" && hour !== (to === 0 ? 23 : to - 1)) {
    // Last period incomplete - mark as "EndMissing" and remove from planning
    let i = periodStatus.length - 1;
    do {
      periodStatus[i] = "EndMissing";
      hour = DateTime.fromISO(startTimes[i]).hour;
      i--;
    } while (periodStatus[i] === "Inside" && hour !== from);
    startIndexes.splice(startIndexes.length - 1, 1);
  }
  
  // If we've reached the expected end hour, mark it as the final endpoint
  if (hour === (to === 0 ? 23 : to - 1) && (isHourly ? true : minute === (60 - intervalMinutes))) {
    endIndexes.push(startTimes.length - 1);
  }

  // Initialize the on/off schedule array
  const onOff = [];

  // Set default values for hours that will not be planned (outside periods or incomplete periods)
  periodStatus.forEach((s, i) => {
    onOff[i] =
      s === "Outside"
        ? node.outputOutsidePeriod  // Use configured value for hours outside the planning period
        : s === "StartMissing" || s === "EndMissing"
        ? node.outputIfNoSchedule   // Use configured value for incomplete periods
        : null;                     // Will be planned later for "Inside" periods
  });

  // Generate optimal schedules for each complete period
  startIndexes.forEach((s, i) => {
    makePlan(node, values, onOff, s, endIndexes[i], intervalMinutes);
  });

  return onOff;
}

function makePlan(node, values, onOff, fromIndex, toIndex, intervalMinutes = 60) {
  const valuesInPeriod = values.slice(fromIndex, toIndex + 1);
  const numTimeSlots = Math.round(node.hoursOn * (60 / intervalMinutes));
  const res = node.doNotSplit
    ? getBestContinuous(valuesInPeriod, numTimeSlots)
    : getBestX(valuesInPeriod, numTimeSlots);
  const sumPriceOn = res.reduce((p, v, i) => {
    return p + (v ? valuesInPeriod[i] : 0);
  }, 0);
  const average = sumPriceOn / numTimeSlots;
  res.forEach((v, i) => {
    onOff[fromIndex + i] =
      node.maxPrice == null
        ? v
        : node.doNotSplit
        ? v && average <= node.maxPrice
        : v && valuesInPeriod[i] <= node.maxPrice;
  });
  return onOff;
}

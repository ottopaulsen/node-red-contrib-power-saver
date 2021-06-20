const { DateTime } = require("luxon");
module.exports = function (RED) {
  function PowerSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const nodeContext = node.context();
    const powerData = readPowerDataFromStorage(nodeContext);
    node.on("input", function (msg) {
      // console.log("Got input: ", msg);
      if (!validateInput(node, msg)) {
        return;
      }

      const rawToday = msg.payload.raw_today;
      const rawTomorrow = msg.payload.raw_tomorrow;
      const todaysDate = DateTime.fromISO(rawToday[0].start.substr(0, 10));
      const yesterdayDate = todaysDate.plus({ days: -1 }).toISODate();

      const scheduleToday =
        loadSavedSchedule(todaysDate) ??
        schedule(rawToday, loadSavedSchedule(yesterdayDate) ?? []);
      const scheduleTomorrow =
        rawTomorrow.length > 0 ? schedule(rawTomorrow) : null;

      deleteSavedScheduleBefore(yesterdayDate);

      node.send([
        null,
        null,
        {
          payload: {
            schedule: {
              today: [],
              tomorrow: [],
            },
          },
        },
      ]);
    });
  }
  RED.nodes.registerType("power-saver", PowerSaverNode);
};

function loadSavedSchedule(date) {
  // Load saved schedule for the date (YYYY-MM-DD)
  // Return null if not found
  return null;
}

function deleteSavedScheduleBefore(day) {}

function schedule(dayData, dayBeforeSchedule) {
  return [];
}

function validateInput(node, msg) {
  if (!msg.payload) {
    node.warn("Payload missing");
    return false;
  }
  const payload = msg.payload;
  if (typeof payload !== "object") {
    node.warn("Payload must be an object");
    return false;
  }
  ["raw_today", "raw_tomorrow"].forEach((arr) => {
    if (!payload[arr]) {
      node.warn(`Payload is missing ${arr} array`);
      return false;
    }
    if (
      payload[arr].some((day) => {
        return (
          day.start === undefined ||
          day.end === undefined ||
          day.value === undefined
        );
      })
    ) {
      node.warn(
        `Malformed entries in payload.${arr}. All entries must contain start, end and value.`
      );
    }
  });
  if (!payload.raw_today.length && !payload.raw_today.length) {
    node.warn("Payload has no data");
    return false;
  }

  return true;
}

function readPowerDataFromStorage(context) {
  const powerData = {
    prices: {
      today: undefined,
      tomorrow: undefined,
    },
    schedule: {
      today: undefined,
      tomorrow: undefined,
    },
  };
  return powerData;
}

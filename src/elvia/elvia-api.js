const fetch = require("node-fetch");

function ping(node, subscriptionKey, setResultStatus = true) {
  const url = "https://elvia.azure-api.net/grid-tariff/Ping";
  const headers = { "X-API-Key": subscriptionKey };
  fetch(url, { headers })
    .then((res) => {
      if (setResultStatus) {
        setNodeStatus(node, res.status);
      }
    })
    .catch((e) => {
      console.log("Elvia API error: " + e);
    });
}

function getTariff(node, subscriptionKey, tariffKey, range = "today", setResultStatus = true) {
  const url =
    "https://elvia.azure-api.net/grid-tariff/digin/api/1.0/tariffquery?TariffKey=" + tariffKey + "&Range=" + range;
  return get(node, subscriptionKey, url, setResultStatus);
}

function getTariffForPeriod(node, subscriptionKey, tariffKey, startTime, endTime, setResultStatus = true) {
  const url =
    "https://elvia.azure-api.net/grid-tariff/digin/api/1.0/tariffquery?TariffKey=" +
    tariffKey +
    "&StartTime=" +
    startTime +
    "&EndTime=" +
    endTime;
  return get(node, subscriptionKey, url, setResultStatus);
}

function getTariffTypes(node, subscriptionKey, setResultStatus = true) {
  const url = "https://elvia.azure-api.net/grid-tariff/digin/api/1.0/tarifftype";
  return get(node, subscriptionKey, url, setResultStatus);
}

function get(node, subscriptionKey, url, setResultStatus) {
  const headers = { "X-API-Key": subscriptionKey };
  return fetch(url, { headers })
    .then((res) => {
      if (setResultStatus && node) {
        setNodeStatus(node, res.status);
      }
      if (res.status === 500) {
        console.error("Elvia internal server error (status 500)");
        return;
      }
      return res.json().then((json) => {
        if (json.statusCode === 401) {
          console.error("Elvia API error: " + json.message);
        }
        return json;
      });
    })
    .catch((e) => {
      console.log("Elvia API error: " + e);
    });
}

function setNodeStatus(node, status) {
  if (status === 200) {
    node.status({ fill: "green", shape: "dot", text: "Connected" });
  } else if (status === 401) {
    node.status({ fill: "red", shape: "dot", text: "Unauthorized" });
  } else if (status === 403) {
    node.status({ fill: "red", shape: "dot", text: "Forbidden" });
  } else if (status === 500) {
    node.status({ fill: "red", shape: "dot", text: "Elvia server error" });
  }
}

module.exports = {
  ping,
  getTariff,
  getTariffForPeriod,
  getTariffTypes,
};

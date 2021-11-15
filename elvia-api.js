const fetch = require("node-fetch");

function ping(node, subscriptionKey, setResultStatus = true) {
  const url = "https://elvia.azure-api.net/grid-tariff/Ping";
  const headers = { "Ocp-Apim-Subscription-Key": subscriptionKey };
  fetch(url, { headers }).then((res) => {
    if (setResultStatus) {
      setNodeStatus(node, res.status);
    }
  });
}

function getTariff(node, subscriptionKey, tariffKey, range = "today", setResultStatus = true) {
  const url = "https://elvia.azure-api.net/grid-tariff/api/1/tariffquery?TariffKey=" + tariffKey + "&Range=" + range;
  return get(node, subscriptionKey, url, setResultStatus);
}

function getTariffTypes(node, subscriptionKey, setResultStatus = true) {
  const url = "https://elvia.azure-api.net/grid-tariff/api/1/tarifftype";
  return get(node, subscriptionKey, url, setResultStatus);
}

function get(node, subscriptionKey, url, setResultStatus) {
  const headers = { "Ocp-Apim-Subscription-Key": subscriptionKey };
  return fetch(url, { headers }).then((res) => {
    if (setResultStatus && node) {
      setNodeStatus(node, res.status);
    }
    return res.json();
  });
}

function setNodeStatus(node, status) {
  if (status === 200) {
    node.status({ fill: "green", shape: "dot", text: "Connected" });
  } else if (status === 401) {
    node.status({ fill: "red", shape: "dot", text: "Unauthorized" });
  } else if (status === 403) {
    node.status({ fill: "red", shape: "dot", text: "Forbidden" });
  }
}

module.exports = {
  ping,
  getTariff,
  getTariffTypes,
};

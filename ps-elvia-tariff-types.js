const fetch = require("node-fetch");
const { getTariffTypes, ping } = require("./elvia-api");

module.exports = function (RED) {
  function PsElviaTariffTypesNode(config) {
    RED.nodes.createNode(this, config);
    this.elviaConfig = RED.nodes.getNode(config.elviaConfig);
    const node = this;
    if (!this.elviaConfig) {
      setStatusError(node, "Elvia config not set");
    } else if (!this.elviaConfig.elviaSubscriptionKey) {
      setStatusError(node, "Elvia subscription key not set");
    } else {
      node.status({ fill: "yellow", shape: "dot", text: "Checking Elvia status" });
    }

    ping(node, this.elviaConfig.elviaSubscriptionKey);

    node.on("input", function (msg) {
      const configList = node.context().global.get("elviraConfigList") || [];
      const key = configList.find((c) => c.id == node.elviaConfig.id)?.elviaSubscriptionKey;
      getTariffTypes(node, key).then((json) => {
        node.send([{ payload: json }]);
      });
    });
  }

  RED.nodes.registerType("ps-elvia-tariff-types", PsElviaTariffTypesNode);
};

function setStatusError(node, message) {
  node.status({ fill: "red", shape: "dot", text: message });
  node.warn(message);
}

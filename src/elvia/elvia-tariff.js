const fetch = require("node-fetch");
const { getTariff, ping } = require("./elvia-api");

module.exports = function (RED) {
  function PsElviaTariffNode(config) {
    RED.nodes.createNode(this, config);
    this.elviaConfig = RED.nodes.getNode(config.elviaConfig);
    this.tariffKey = config.tariffKey;
    this.range = config.range;
    const node = this;

    const configList = node.context().global.get("elviaConfigList") || [];
    const key = configList.find((c) => c.id == node.elviaConfig.id)?.elviaSubscriptionKey;
    ping(node, key);

    node.on("input", function () {
      const configList = node.context().global.get("elviaConfigList") || [];
      const key = configList.find((c) => c.id == node.elviaConfig.id)?.elviaSubscriptionKey;
      getTariff(node, key, node.tariffKey, node.range).then((json) => {
        node.send([{ payload: json }]);
      });
    });
  }

  RED.nodes.registerType("ps-elvia-tariff", PsElviaTariffNode);
};

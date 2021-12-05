const { getTariffTypes, ping } = require("./elvia-api");

module.exports = function (RED) {
  function PsElviaTariffTypesNode(config) {
    RED.nodes.createNode(this, config);
    this.elviaConfig = RED.nodes.getNode(config.elviaConfig);
    const node = this;

    const configList = node.context().global.get("elviaConfigList") || [];
    const key = configList.find((c) => c.id == node.elviaConfig.id)?.elviaSubscriptionKey;
    ping(node, key);

    node.on("input", function (msg) {
      const configList = node.context().global.get("elviaConfigList") || [];
      const key = configList.find((c) => c.id == node.elviaConfig.id)?.elviaSubscriptionKey;
      getTariffTypes(node, key).then((json) => {
        node.send([{ payload: json }]);
      });
    });
  }

  RED.nodes.registerType("ps-elvia-tariff-types", PsElviaTariffTypesNode);
};

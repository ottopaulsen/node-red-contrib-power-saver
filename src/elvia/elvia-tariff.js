const { getTariff, ping } = require("./elvia-api");

module.exports = function (RED) {
  function PsElviaTariffNode(config) {
    RED.nodes.createNode(this, config);
    this.elviaConfig = RED.nodes.getNode(config.elviaConfig);
    const key = this.elviaConfig.credentials.elviaSubscriptionKey;
    this.tariffKey = config.tariffKey;
    this.range = config.range;
    const node = this;
    ping(node, key);

    node.on("input", function () {
      getTariff(node, key, node.tariffKey, node.range).then((json) => {
        node.send([{ payload: json }]);
      });
    });
  }

  RED.nodes.registerType("ps-elvia-tariff", PsElviaTariffNode);
};

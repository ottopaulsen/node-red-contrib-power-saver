const { getPriceData } = require("./receive-price-functions");

module.exports = function (RED) {
  function ReceivePriceNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", function (msg) {
      const { priceData, source } = getPriceData(node, msg);
      if (!priceData) {
        // Set status failed
        return;
      }

      // Send output
      node.send({ payload: { priceData, source } });
    });
  }

  RED.nodes.registerType("ps-receive-price", ReceivePriceNode);
};

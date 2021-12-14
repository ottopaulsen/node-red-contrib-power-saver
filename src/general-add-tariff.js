const { DateTime } = require("luxon");
const { roundPrice } = require("./utils");

module.exports = function (RED) {
  function PsGeneralAddTariffNode(config) {
    RED.nodes.createNode(this, config);
    this.range = config.range;
    const node = this;

    node.on("input", function (msg) {
      const prices = msg.payload.priceData;
      const fromTime = prices[0].start.substr(0, 19);
      const toTime = DateTime.fromISO(prices[prices.length - 1].start)
        .plus({ hours: 1 })
        .toISO()
        .substr(0, 19);
    });
  }

  RED.nodes.registerType("ps-general-add-tariff", PsGeneralAddTariffNode);
};

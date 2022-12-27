const cloneDeep = require("lodash.clonedeep");
const { addTariffToPrices } = require("./general-add-tariff-functions");
const { getEffectiveConfig } = require("./utils");

module.exports = function (RED) {
  function PsGeneralAddTariffNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const originalConfig = {
      periods: config.periods,
      validFrom: config.validFrom,
      validTo: config.validTo,
      days: config.days,
    };
    node.context().set("config", originalConfig);

    node.on("input", function (originalMessage) {
      const msg = cloneDeep(originalMessage);
      const effectiveConfig = getEffectiveConfig(node, msg);
      const prices = msg.payload.priceData;
      if (!prices || prices.length === 0) {
        return;
      }

      addTariffToPrices(node, effectiveConfig, prices);

      node.send(msg);
    });
  }

  RED.nodes.registerType("ps-general-add-tariff", PsGeneralAddTariffNode);
};

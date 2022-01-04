const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const { addTariffToPrices, buildAllHours } = require("./general-add-tariff-functions");
const { roundPrice } = require("./utils");
const { extractPlanForDate, getEffectiveConfig, validationFailure } = require("./utils");

module.exports = function (RED) {
  function PsGeneralAddTariffNode(config) {
    RED.nodes.createNode(this, config);
    this.range = config.range;
    const node = this;

    const originalConfig = {
      periods: config.periods,
      validFrom: config.validFrom,
      validTo: config.validTo,
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

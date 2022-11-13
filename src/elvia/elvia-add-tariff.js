const { DateTime } = require("luxon");
const { getTariffForPeriod, ping } = require("./elvia-api");
const { roundPrice } = require("../utils");

module.exports = function (RED) {
  function PsElviaAddTariffNode(config) {
    RED.nodes.createNode(this, config);
    this.elviaConfig = RED.nodes.getNode(config.elviaConfig);
    const key = this.elviaConfig.credentials.elviaSubscriptionKey;
    this.tariffKey = config.tariffKey;
    const node = this;
    ping(node, key);

    node.on("input", function (msg) {
      const prices = msg.payload.priceData;
      if (!prices) {
        node.warn(
          "No price data received on input. Did you use the ps-receive-price node or convert to correct format otherwise?"
        );
        return;
      }
      // Convert date to UTC to get correct parameter for the Elvia API (no timezone)
      const fromTime = DateTime.fromISO(prices[0].start).toUTC().toISO().substring(0, 19);
      const toTime = DateTime.fromISO(prices[prices.length - 1].start)
        .plus({ hours: 1 })
        .toUTC()
        .toISO()
        .substring(0, 19);

      getTariffForPeriod(node, key, node.tariffKey, fromTime, toTime).then((json) => {
        const tariff = json;
        const priceInfo = tariff.gridTariff?.tariffPrice?.hours || [];
        if (priceInfo.length !== prices.length) {
          node.warn(`Elvia tariff count mismatch. Expected ${prices.length} items, but got ${priceInfo.length}`);
        } else {
          prices.forEach((p, i) => {
            p.powerPrice = p.value;
            p.gridTariffVariable = priceInfo[i].energyPrice.total;
            p.value = roundPrice(p.powerPrice + p.gridTariffVariable);
          });
        }
        const payload = { priceData: prices };
        if (msg.payload.config) {
          payload.config = msg.payload.config;
        }
        node.send([{ payload }]);
      });
    });
  }

  RED.nodes.registerType("ps-elvia-add-tariff", PsElviaAddTariffNode);
};

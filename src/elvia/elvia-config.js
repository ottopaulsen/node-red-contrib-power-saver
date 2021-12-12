const { getTariffTypes } = require("./elvia-api");

module.exports = function (RED) {
  function ElviaConfigNode(config) {
    RED.nodes.createNode(this, config);

    // Store config in global configList
    const configList = this.context().global.get("elviaConfigList") || [];
    configList.push(config);
    this.context().global.set("elviaConfigList", configList);

    const node = this;

    RED.httpAdmin.get("/elvia-tariff-types", RED.auth.needsPermission("ps-elvia-config.read"), function (req, res) {
      const configList = node.context().global.get("elviaConfigList") || [];
      const configId = req.query.configId;
      const key = configList.find((c) => c.id == configId)?.elviaSubscriptionKey;
      console.log("Getting tariff types for key " + key);
      getTariffTypes(null, key).then((json) => {
        res.json(json);
      });
    });
  }
  RED.nodes.registerType("ps-elvia-config", ElviaConfigNode);
};

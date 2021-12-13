const { getTariffTypes } = require("./elvia-api");

module.exports = function (RED) {
  function ElviaConfigNode(config) {
    RED.nodes.createNode(this, config);

    this.elviaConfig = RED.nodes.getNode(config.elviaConfig);

    // Store config in global configList
    const configList = this.context().global.get("elviaConfigList") || [];
    configList.push(config);
    this.context().global.set("elviaConfigList", configList);
  }
  RED.nodes.registerType("ps-elvia-config", ElviaConfigNode, {
    credentials: {
      elviaSubscriptionKey: { type: "text" },
    },
  });
};

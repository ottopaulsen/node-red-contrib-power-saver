module.exports = function (RED) {
  function StrategyLightSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const serverConfig = RED.nodes.getNode(config.server);
    const entities = Array.isArray(config.entityId) ? config.entityId : [];

    if (!serverConfig) {
      node.status({ fill: "red", shape: "ring", text: "No server configured" });
      node.error("No Home Assistant server configured");
      return;
    }

    if (entities.length === 0) {
      node.status({ fill: "yellow", shape: "ring", text: "No entities selected" });
      node.warn("No entities selected to monitor");
      return;
    }

    node.status({ fill: "yellow", shape: "ring", text: "Connecting..." });

    // Store entity listeners
    const entityListeners = {};

    // Function to handle state changes
    const handleStateChange = function (entityId, newState, oldState) {
      node.status({ fill: "green", shape: "dot", text: `Last: ${entityId}` });
      
      const msg = {
        payload: newState.state,
        entity_id: entityId,
        data: {
          entity_id: entityId,
          new_state: newState,
          old_state: oldState,
        },
      };

      node.send(msg);
    };

    // Subscribe to entity state changes
    // Note: This is a placeholder implementation
    // In a real implementation, this would use the Home Assistant websocket API
    // via node-red-contrib-home-assistant-websocket integration
    try {
      entities.forEach((entityId) => {
        // Placeholder for actual Home Assistant integration
        // In a real implementation, you would subscribe to entity state changes like:
        // serverConfig.websocket.subscribeToStateChanges(entityId, (newState, oldState) => {
        //   handleStateChange(entityId, newState, oldState);
        // });
        
        node.log(`Monitoring entity: ${entityId}`);
      });

      node.status({ fill: "green", shape: "dot", text: `Monitoring ${entities.length} entities` });
    } catch (err) {
      node.status({ fill: "red", shape: "ring", text: "Connection failed" });
      node.error(`Failed to subscribe to entities: ${err.message}`);
    }

    // Clean up on node close
    node.on("close", function () {
      // Unsubscribe from all entities
      Object.keys(entityListeners).forEach((entityId) => {
        // Placeholder for cleanup
        // In a real implementation: serverConfig.websocket.unsubscribe(entityListeners[entityId]);
        node.log(`Unsubscribed from entity: ${entityId}`);
      });
      
      node.status({});
    });
  }

  RED.nodes.registerType("ps-strategy-light-saver", StrategyLightSaverNode);
};

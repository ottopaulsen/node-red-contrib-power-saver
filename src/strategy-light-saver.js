module.exports = function (RED) {
  function StrategyLightSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const entities = Array.isArray(config.entityId) ? config.entityId : [];

    if (entities.length === 0) {
      node.status({ fill: "yellow", shape: "ring", text: "No entities selected" });
      node.warn("No entities selected to monitor");
      return;
    }

    const serverConfigNode = RED.nodes.getNode(config.server);
    if (!serverConfigNode) {
      node.status({ fill: "red", shape: "ring", text: "No server configured" });
      node.error("No Home Assistant server configured");
      return;
    }

    node.status({ fill: "yellow", shape: "ring", text: "Connecting..." });

    // Try to get the HA module from require.cache since it's already loaded
    let haModule = null;
    const cacheKeys = Object.keys(require.cache);
    const haModulePath = cacheKeys.find(k => k.includes('node-red-contrib-home-assistant-websocket') && k.includes('homeAssistant'));
    
    if (haModulePath) {
      try {
        haModule = require.cache[haModulePath].exports;
        node.warn("Found HA module in cache: " + haModulePath);
      } catch (e) {
        node.warn("Failed to load from cache: " + e.message);
      }
    }
    
    // Try alternative: find the main module exports
    if (!haModule) {
      const mainModulePath = cacheKeys.find(k => 
        k.includes('node-red-contrib-home-assistant-websocket') && 
        (k.endsWith('index.js') || k.includes('homeAssistant/index'))
      );
      if (mainModulePath) {
        try {
          haModule = require.cache[mainModulePath].exports;
          node.warn("Found HA module at: " + mainModulePath);
        } catch (e) {
          node.warn("Failed to load: " + e.message);
        }
      }
    }

    if (!haModule || !haModule.getHomeAssistant) {
      node.error("Could not access getHomeAssistant function from HA module");
      node.status({ fill: "red", shape: "ring", text: "HA module not accessible" });
      return;
    }

    const homeAssistant = haModule.getHomeAssistant(serverConfigNode);
    if (!homeAssistant || !homeAssistant.eventBus) {
      node.error("Could not get homeAssistant or eventBus");
      node.status({ fill: "red", shape: "ring", text: "No eventBus" });
      return;
    }

    node.warn("Successfully got eventBus!");

    // Function to handle state changes
    const handleStateChange = function (event) {
      node.send({
        topic: "debug",
        payload: "Event received!",
        event: event
      });
      
      if (!event || !event.event || !event.event.data) return;
      
      const entityId = event.event.data.entity_id;
      const newState = event.event.data.new_state;
      const oldState = event.event.data.old_state;
      
      if (!entityId || !newState) return;
      
      node.status({ 
        fill: "green", 
        shape: "dot", 
        text: `${entityId}: ${newState.state}` 
      });
      
      const msg = {
        topic: entityId,
        payload: newState.state,
        data: {
          entity_id: entityId,
          new_state: {
            state: newState.state,
            attributes: newState.attributes || {},
            last_changed: newState.last_changed,
            last_updated: newState.last_updated,
          },
          old_state: oldState ? {
            state: oldState.state,
            attributes: oldState.attributes || {},
            last_changed: oldState.last_changed,
            last_updated: oldState.last_updated,
          } : null,
          timestamp: new Date().toISOString(),
        },
      };

      node.send(msg);
    };

    try {
      entities.forEach((entityId) => {
        const eventTopic = `ha_events:state_changed:${entityId}`;
        homeAssistant.eventBus.on(eventTopic, handleStateChange);
        node.warn(`Subscribed to: ${eventTopic}`);
      });

      node.status({ fill: "green", shape: "dot", text: `Monitoring ${entities.length} entities` });
    } catch (err) {
      node.status({ fill: "red", shape: "ring", text: "Subscription failed" });
      node.error(`Failed to subscribe: ${err.message}`);
    }

    // Clean up on node close
    node.on("close", function () {
      if (homeAssistant && homeAssistant.eventBus) {
        entities.forEach((entityId) => {
          const eventTopic = `ha_events:state_changed:${entityId}`;
          homeAssistant.eventBus.removeListener(eventTopic, handleStateChange);
        });
      }
      node.status({});
    });
  }

  RED.nodes.registerType("ps-strategy-light-saver", StrategyLightSaverNode);
};

module.exports = function (RED) {
  const packageJson = require('../package.json');
  const VERSION = packageJson.version;
  
  function StrategyLightSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const triggers = Array.isArray(config.triggers) ? config.triggers : [];
    const lights = Array.isArray(config.lights) ? config.lights : [];

    if (triggers.length === 0) {
      node.status({ fill: "yellow", shape: "ring", text: "No triggers selected" });
      node.warn("No triggers selected to monitor");
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

    // Function to handle state changes
    const handleStateChange = function (event) {
      node.log("State change event received: " + JSON.stringify(event).substring(0, 200));
      
      if (!event || !event.event) return;
      
      const entityId = event.event.entity_id;
      const newState = event.event.new_state;
      
      if (!entityId || !newState) {
        node.warn(`Event missing entity_id or new_state: ${JSON.stringify(event).substring(0, 100)}`);
        return;
      }
      
      node.log(`Processing state change for ${entityId}: ${newState.state}`);
      
      // Find the trigger in the array and update it
      const trigger = triggers.find(t => t.entity_id === entityId);
      if (trigger) {
        const now = new Date();
        const timestamp = now.toISOString().substring(0, 19); // Format: yyyy-mm-ddTHH:MM:SS
        const timeOnly = now.toISOString().substring(11, 19); // Format: HH:MM:SS
        
        trigger.lastChanged = timestamp;
        trigger.state = newState.state;
        
        node.log(`Updated trigger ${entityId}: state=${trigger.state}, lastChanged=${trigger.lastChanged}`);
        
        node.status({ 
          fill: "green", 
          shape: "dot", 
          text: `${entityId}: ${newState.state} - updated ${timeOnly}` 
        });
      } else {
        node.warn(`Received state change for ${entityId} but not found in triggers list`);
      }
    };

    // Handle input messages
    node.on("input", function(msg) {
      let payload = msg.payload;
      
      // If payload is a string, try to parse it as JSON
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          node.warn("Failed to parse payload as JSON: " + e.message);
          return;
        }
      }
      
      if (!payload || !payload.commands) return;
      
      const commands = payload.commands;
      const output = { 
        payload: {
          version: VERSION
        }
      };
      
      if (commands.sendTriggers === true) {
        output.payload.triggers = triggers;
      }
      
      if (commands.sendLights === true) {
        output.payload.lights = lights;
      }
      
      // Only send if we have something to send (beyond just version)
      if (output.payload.triggers || output.payload.lights) {
        node.send(output);
      }
    });

    try {
      // Subscribe to state_changed events for each trigger
      triggers.forEach((trigger) => {
        const entityId = trigger.entity_id;
        const eventTopic = `ha_events:state_changed:${entityId}`;
        homeAssistant.eventBus.on(eventTopic, handleStateChange);
        node.log(`Subscribed to ${eventTopic}`);
      });

      node.status({ fill: "green", shape: "dot", text: `Monitoring ${triggers.length} triggers, ${lights.length} lights` });
      node.log(`Monitoring ${triggers.length} triggers and ${lights.length} lights`);
    } catch (err) {
      node.status({ fill: "red", shape: "ring", text: "Subscription failed" });
      node.error(`Failed to subscribe: ${err.message}`);
      node.error(err.stack);
      return;
    }

    // Note: Initial states will be populated as state change events come in
    // The websocket.states object is not populated immediately at startup

    // Clean up on node close
    node.on("close", function () {
      if (homeAssistant && homeAssistant.eventBus) {
        triggers.forEach((trigger) => {
          const entityId = trigger.entity_id;
          const eventTopic = `ha_events:state_changed:${entityId}`;
          homeAssistant.eventBus.removeListener(eventTopic, handleStateChange);
        });
      }
      node.status({});
    });
  }

  RED.nodes.registerType("ps-strategy-light-saver", StrategyLightSaverNode);
};

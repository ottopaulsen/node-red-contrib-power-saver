module.exports = function (RED) {
  const packageJson = require('../package.json');
  const VERSION = packageJson.version;
  
  function StrategyLightSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const triggers = Array.isArray(config.triggers) ? config.triggers : [];
    const lights = Array.isArray(config.lights) ? config.lights : [];
    const nightSensor = config.nightSensor || null;
    const levels = Array.isArray(config.levels) ? config.levels : [];

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
      
      const now = new Date();
      const timestamp = now.toISOString().substring(0, 19); // Format: yyyy-mm-ddTHH:MM:SS
      const timeOnly = now.toISOString().substring(11, 19); // Format: HH:MM:SS
      
      // Check if it's a trigger
      const trigger = triggers.find(t => t.entity_id === entityId);
      if (trigger) {
        trigger.lastChanged = timestamp;
        trigger.state = newState.state;
        
        node.log(`Updated trigger ${entityId}: state=${trigger.state}, lastChanged=${trigger.lastChanged}`);
        
        node.status({ 
          fill: "green", 
          shape: "dot", 
          text: `${entityId}: ${newState.state} - updated ${timeOnly}` 
        });
        return;
      }
      
      // Check if it's the night sensor
      if (nightSensor && nightSensor.entity_id === entityId) {
        nightSensor.lastChanged = timestamp;
        nightSensor.state = newState.state;
        
        node.log(`Updated night sensor ${entityId}: state=${nightSensor.state}, lastChanged=${nightSensor.lastChanged}`);
        
        node.status({ 
          fill: "green", 
          shape: "dot", 
          text: `Night: ${newState.state} - updated ${timeOnly}` 
        });
        return;
      }
      
      node.warn(`Received state change for ${entityId} but not found in triggers or nightSensor`);
    };

    // Function to fetch current states from Home Assistant
    const fetchMissingStates = function() {
      const entitiesToFetch = [];
      
      // Check triggers
      triggers.forEach(trigger => {
        if (!trigger.state && trigger.entity_id) {
          entitiesToFetch.push({ id: trigger.entity_id, type: 'trigger' });
        }
      });
      
      // Check night sensor
      if (nightSensor && !nightSensor.state && nightSensor.entity_id) {
        entitiesToFetch.push({ id: nightSensor.entity_id, type: 'nightSensor' });
      }
      
      if (entitiesToFetch.length === 0) {
        node.log('All entities already have states');
        return;
      }
      
      node.log(`Fetching states for ${entitiesToFetch.length} entities: ${entitiesToFetch.map(e => e.id).join(', ')}`);
      
      try {
        // Access states from the websocket - it's stored as a flat object
        const states = homeAssistant.websocket.states;
        node.log(`States object type: ${typeof states}, keys count: ${states ? Object.keys(states).length : 0}`);
        
        if (states && typeof states === 'object') {
          entitiesToFetch.forEach(entity => {
            const stateObj = states[entity.id];
            node.log(`Looking for ${entity.id}, found: ${stateObj ? 'yes' : 'no'}`);
            
            if (stateObj) {
              if (entity.type === 'trigger') {
                const trigger = triggers.find(t => t.entity_id === entity.id);
                if (trigger) {
                  trigger.state = stateObj.state;
                  trigger.lastChanged = stateObj.last_changed || stateObj.last_updated;
                  node.log(`Fetched state for trigger ${entity.id}: ${stateObj.state}`);
                }
              } else if (entity.type === 'nightSensor') {
                nightSensor.state = stateObj.state;
                nightSensor.lastChanged = stateObj.last_changed || stateObj.last_updated;
                node.log(`Fetched state for night sensor ${entity.id}: ${stateObj.state}`);
              }
            } else {
              node.warn(`State not found for ${entity.id}`);
            }
          });
        } else {
          node.warn('States object not available or not an object');
        }
      } catch (err) {
        node.warn(`Failed to fetch states: ${err.message}`);
        node.warn(err.stack);
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
      
      if (commands.sendNightSensor === true) {
        output.payload.nightSensor = nightSensor;
      }
      
      if (commands.sendLevels === true) {
        output.payload.levels = levels;
      }
      
      // Fetch states from HA for entities that don't have state yet
      fetchMissingStates();
      
      // Only send if we have something to send (beyond just version)
      if (output.payload.triggers || output.payload.lights || output.payload.nightSensor || output.payload.levels) {
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
      
      // Subscribe to night sensor if configured
      if (nightSensor && nightSensor.entity_id) {
        const eventTopic = `ha_events:state_changed:${nightSensor.entity_id}`;
        homeAssistant.eventBus.on(eventTopic, handleStateChange);
        node.log(`Subscribed to night sensor: ${eventTopic}`);
      }

      const nightSensorText = nightSensor ? ', 1 night sensor' : '';
      node.status({ fill: "green", shape: "dot", text: `Monitoring ${triggers.length} triggers, ${lights.length} lights${nightSensorText}, ${levels.length} levels` });
      node.log(`Monitoring ${triggers.length} triggers, ${lights.length} lights${nightSensorText}, and ${levels.length} levels`);
      
      // Fetch initial states after a delay to allow HA to connect
      setTimeout(() => {
        node.log('Fetching initial states after startup delay...');
        fetchMissingStates();
      }, 6000); // 6 seconds should be enough for HA to connect
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
        
        if (nightSensor && nightSensor.entity_id) {
          const eventTopic = `ha_events:state_changed:${nightSensor.entity_id}`;
          homeAssistant.eventBus.removeListener(eventTopic, handleStateChange);
        }
      }
      node.status({});
    });
  }

  RED.nodes.registerType("ps-strategy-light-saver", StrategyLightSaverNode);
};

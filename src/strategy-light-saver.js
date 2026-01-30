module.exports = function (RED) {
  const packageJson = require('../package.json');
  const VERSION = packageJson.version;
  const funcs = require('./strategy-light-saver-functions');
  
  function StrategyLightSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    // Configuration
    const nodeConfig = {
      triggers: Array.isArray(config.triggers) ? config.triggers : [],
      lights: Array.isArray(config.lights) ? config.lights : [],
      lightTimeout: config.lightTimeout !== undefined ? config.lightTimeout : 10,
      nightSensor: config.nightSensor || null,
      nightLevel: config.nightLevel !== undefined ? config.nightLevel : null, // Level used when night sensor is on
      levels: Array.isArray(config.levels) ? config.levels : [],
      debugLog: config.debugLog === true
    };
    
    // Debug logging function
    const debugLog = function(message) {
      if (nodeConfig.debugLog) {
        node.log(message);
      }
    };
    
    // Create wrapper node object with debug logging
    const nodeWrapper = {
      log: debugLog,
      warn: node.warn.bind(node),
      error: node.error.bind(node),
      status: node.status.bind(node)
    };
    
    // Mutable state
    const state = {
      timedOut: undefined // Tracks if all triggers are currently off
    };
    
    let timeoutCheckInterval = null; // Timer for checking timeouts every minute

    if (nodeConfig.triggers.length === 0) {
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
      funcs.handleStateChange(event, nodeConfig, state, nodeWrapper, homeAssistant);
    };
    
    // Function to check timeouts every minute
    const checkTimeouts = function() {
      funcs.checkTimeouts(nodeConfig, state, nodeWrapper, homeAssistant);
    };

    // Function to fetch current states from Home Assistant
    const fetchMissingStates = function() {
      const initialTimedOutWasSet = funcs.fetchMissingStates(nodeConfig, state, nodeWrapper, homeAssistant);
      
      // Start timeout check timer if initial timedOut was just set
      if (initialTimedOutWasSet && !timeoutCheckInterval) {
        debugLog('Starting timeout check timer (runs every minute)');
        timeoutCheckInterval = setInterval(checkTimeouts, 60000); // 60000ms = 1 minute
        
        // Run an immediate check in case lights should already be turned off after restart
        debugLog('Running immediate timeout check after restart');
        setTimeout(() => checkTimeouts(), 1000); // Check after 1 second to ensure states are loaded
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
      
      // If sendSettings is true, send all configuration
      if (commands.sendSettings === true) {
        // Fetch states from HA for entities that don't have state yet
        fetchMissingStates();
        
        const output = { 
          payload: {
            version: VERSION,
            triggers: nodeConfig.triggers,
            lights: nodeConfig.lights,
            lightTimeout: nodeConfig.lightTimeout,
            nightSensor: nodeConfig.nightSensor,
            nightLevel: nodeConfig.nightLevel,
            levels: nodeConfig.levels,
            timedOut: state.timedOut
          }
        };
        
        node.send(output);
      }
    });

    try {
      // Subscribe to state_changed events for each trigger
      nodeConfig.triggers.forEach((trigger) => {
        const entityId = trigger.entity_id;
        const eventTopic = `ha_events:state_changed:${entityId}`;
        homeAssistant.eventBus.on(eventTopic, handleStateChange);
        debugLog(`Subscribed to ${eventTopic}`);
      });
      
      // Subscribe to night sensor if configured
      if (nodeConfig.nightSensor && nodeConfig.nightSensor.entity_id) {
        const eventTopic = `ha_events:state_changed:${nodeConfig.nightSensor.entity_id}`;
        homeAssistant.eventBus.on(eventTopic, handleStateChange);
        debugLog(`Subscribed to night sensor: ${eventTopic}`);
      }

      const nightSensorText = nodeConfig.nightSensor ? ', 1 night sensor' : '';
      node.status({ fill: "green", shape: "dot", text: `Monitoring ${nodeConfig.triggers.length} triggers, ${nodeConfig.lights.length} lights${nightSensorText}, ${nodeConfig.levels.length} levels` });
      debugLog(`Monitoring ${nodeConfig.triggers.length} triggers, ${nodeConfig.lights.length} lights${nightSensorText}, and ${nodeConfig.levels.length} levels`);
      
      // Fetch initial states after a delay to allow HA to connect
      setTimeout(() => {
        debugLog('Fetching initial states after startup delay...');
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
      // Clear timeout check interval
      if (timeoutCheckInterval) {
        clearInterval(timeoutCheckInterval);
        timeoutCheckInterval = null;
        debugLog('Cleared timeout check timer');
      }
      
      if (homeAssistant && homeAssistant.eventBus) {
        nodeConfig.triggers.forEach((trigger) => {
          const entityId = trigger.entity_id;
          const eventTopic = `ha_events:state_changed:${entityId}`;
          homeAssistant.eventBus.removeListener(eventTopic, handleStateChange);
        });
        
        if (nodeConfig.nightSensor && nodeConfig.nightSensor.entity_id) {
          const eventTopic = `ha_events:state_changed:${nodeConfig.nightSensor.entity_id}`;
          homeAssistant.eventBus.removeListener(eventTopic, handleStateChange);
        }
      }
      node.status({});
    });
  }

  RED.nodes.registerType("ps-strategy-light-saver", StrategyLightSaverNode);
};

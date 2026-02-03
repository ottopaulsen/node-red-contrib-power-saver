module.exports = function (RED) {
  const packageJson = require('../package.json');
  const VERSION = packageJson.version;
  const funcs = require('./strategy-light-saver-functions');
  
  function StrategyLightSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    // Initialize override from config
    let override = 'auto';
    if (config.overrideEnabled === true) {
      if (config.overrideType === 'off') {
        override = 'off';
      } else if (config.overrideType === 'on') {
        override = 'on';
      } else if (config.overrideType === 'level') {
        override = config.overrideLevel !== undefined ? config.overrideLevel : 50;
      }
    }

    // Configuration
    const nodeConfig = {
      triggers: Array.isArray(config.triggers) ? config.triggers : [],
      lights: Array.isArray(config.lights) ? config.lights : [],
      lightTimeout: config.lightTimeout !== undefined ? config.lightTimeout : 10,
      nightSensor: config.nightSensor || null,
      nightLevel: config.nightLevel !== undefined ? config.nightLevel : null,
      nightDelay: config.nightDelay !== undefined ? config.nightDelay : 0,
      invertNightSensor: config.invertNightSensor === true,
      awaySensor: config.awaySensor || null,
      awayLevel: config.awayLevel !== undefined ? config.awayLevel : null,
      awayDelay: config.awayDelay !== undefined ? config.awayDelay : 0,
      invertAwaySensor: config.invertAwaySensor === true,
      levels: Array.isArray(config.levels) ? config.levels : [],
      debugLog: config.debugLog === true,
      override: override
    };
    
    // Helper function to save override state to context
    const saveOverrideState = function() {
      node.context().set('override', nodeConfig.override);
      node.context().set('overrideEnabled', nodeConfig.override !== 'auto');
      if (nodeConfig.override === 'auto') {
        node.context().set('overrideType', 'on');
      } else if (nodeConfig.override === 'off') {
        node.context().set('overrideType', 'off');
      } else if (nodeConfig.override === 'on') {
        node.context().set('overrideType', 'on');
      } else if (typeof nodeConfig.override === 'number') {
        node.context().set('overrideType', 'level');
        node.context().set('overrideLevel', nodeConfig.override);
      }
    };
    
    // Save initial override state
    saveOverrideState();
    
    let nightActivationTimer = null; // Timer for setting lights to night level when night sensor activates
    let awayActivationTimer = null; // Timer for setting lights to away level when away sensor activates
    
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
      // If override is active (not 'auto'), don't process state changes
      if (nodeConfig.override !== 'auto') {
        debugLog('Override active, ignoring state change');
        return;
      }
      
      const result = funcs.handleStateChange(event, nodeConfig, state, nodeWrapper, homeAssistant);
      
      // Check if night sensor activated (turned on or off if inverted)
      if (result && result.nightSensorTurnedOn && nodeConfig.nightSensor) {
        debugLog(`Night sensor activated, scheduling lights to night level after ${nodeConfig.nightDelay} seconds`);
        
        // Clear any existing timer
        if (nightActivationTimer) {
          clearTimeout(nightActivationTimer);
        }
        
        // Set lights to night level after delay
        nightActivationTimer = setTimeout(() => {
          debugLog('Applying night level to lights');
          const level = funcs.findCurrentLevel(nodeConfig, nodeWrapper);
          if (level !== null) {
            funcs.controlLights(nodeConfig.lights, level, nodeWrapper, homeAssistant);
            node.status({ fill: "blue", shape: "dot", text: `Night mode: ${level}%` });
          } else {
            node.warn('Could not determine level for night mode');
          }
        }, nodeConfig.nightDelay * 1000);
      }
      
      // Check if away sensor activated (turned on or off if inverted)
      if (result && result.awaySensorTurnedOn && nodeConfig.awaySensor) {
        debugLog(`Away sensor activated, scheduling lights to away level after ${nodeConfig.awayDelay} seconds`);
        
        // Clear any existing timer
        if (awayActivationTimer) {
          clearTimeout(awayActivationTimer);
        }
        
        // Set lights to away level after delay
        awayActivationTimer = setTimeout(() => {
          debugLog('Applying away level to lights');
          const level = nodeConfig.awayLevel !== null && nodeConfig.awayLevel !== undefined ? nodeConfig.awayLevel : 0;
          funcs.controlLights(nodeConfig.lights, level, nodeWrapper, homeAssistant);
          node.status({ fill: "yellow", shape: "dot", text: `Away mode: ${level}%` });
        }, nodeConfig.awayDelay * 1000);
      }
    };
    
    // Function to check timeouts every minute
    const checkTimeouts = function() {
      // If override is active (not 'auto'), don't check timeouts
      if (nodeConfig.override !== 'auto') {
        return;
      }
      
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
      
      if (!payload) return;
      
      let sendConfigRequested = false;
      
      // Check for sendConfig request in commands
      if (payload.commands && payload.commands.sendConfig === true) {
        sendConfigRequested = true;
      }
      
      // Check for config updates
      if (payload.config && typeof payload.config === 'object') {
        // Save old config before changes
        const oldConfig = JSON.parse(JSON.stringify(nodeConfig));
        
        // Apply config changes
        if (payload.config.triggers !== undefined) {
          nodeConfig.triggers = Array.isArray(payload.config.triggers) ? payload.config.triggers : [];
        }
        if (payload.config.lights !== undefined) {
          nodeConfig.lights = Array.isArray(payload.config.lights) ? payload.config.lights : [];
        }
        if (payload.config.lightTimeout !== undefined) {
          nodeConfig.lightTimeout = payload.config.lightTimeout;
        }
        if (payload.config.nightSensor !== undefined) {
          nodeConfig.nightSensor = payload.config.nightSensor;
        }
        if (payload.config.nightLevel !== undefined) {
          nodeConfig.nightLevel = payload.config.nightLevel;
        }
        if (payload.config.nightDelay !== undefined) {
          nodeConfig.nightDelay = payload.config.nightDelay;
        }
        if (payload.config.invertNightSensor !== undefined) {
          nodeConfig.invertNightSensor = payload.config.invertNightSensor;
        }
        if (payload.config.awaySensor !== undefined) {
          nodeConfig.awaySensor = payload.config.awaySensor;
        }
        if (payload.config.awayLevel !== undefined) {
          nodeConfig.awayLevel = payload.config.awayLevel;
        }
        if (payload.config.awayDelay !== undefined) {
          nodeConfig.awayDelay = payload.config.awayDelay;
        }
        if (payload.config.invertAwaySensor !== undefined) {
          nodeConfig.invertAwaySensor = payload.config.invertAwaySensor;
        }
        if (payload.config.levels !== undefined) {
          nodeConfig.levels = Array.isArray(payload.config.levels) ? payload.config.levels : [];
        }
        if (payload.config.debugLog !== undefined) {
          nodeConfig.debugLog = payload.config.debugLog;
        }
        
        // Check for override and apply it before sending configs
        if (payload.config.override !== undefined) {
          nodeConfig.override = payload.config.override;
          saveOverrideState();
        }
        
        // Send old config
        node.send({
          payload: {
            oldConfig: oldConfig
          }
        });
        
        // Clear and restart timeout check interval to use new timeouts
        if (timeoutCheckInterval) {
          clearInterval(timeoutCheckInterval);
          timeoutCheckInterval = setInterval(checkTimeouts, 60000);
        }
        
        // Send new config (with updated override)
        node.send({
          payload: {
            newConfig: JSON.parse(JSON.stringify(nodeConfig))
          }
        });
        
        debugLog('Configuration updated via input');
        
        // Apply override actions after config is sent
        if (payload.config.override !== undefined) {
          if (nodeConfig.override === 'off') {
            funcs.turnOffAllLights(nodeConfig.lights, nodeWrapper, homeAssistant);
            node.status({ fill: "red", shape: "dot", text: "Override: OFF" });
            debugLog('Override: OFF - lights turned off');
          } else if (nodeConfig.override === 'on') {
            const level = funcs.findCurrentLevel(nodeConfig, nodeWrapper);
            if (level !== null) {
              funcs.controlLights(nodeConfig.lights, level, nodeWrapper, homeAssistant);
              node.status({ fill: "green", shape: "dot", text: `Override: ON (${level}%)` });
              debugLog(`Override: ON - lights set to ${level}%`);
            }
          } else if (typeof nodeConfig.override === 'number' && nodeConfig.override >= 0 && nodeConfig.override <= 100) {
            funcs.controlLights(nodeConfig.lights, nodeConfig.override, nodeWrapper, homeAssistant);
            node.status({ fill: "green", shape: "dot", text: `Override: ${nodeConfig.override}%` });
            debugLog(`Override: ${nodeConfig.override}% - lights set to ${nodeConfig.override}%`);
          } else if (nodeConfig.override === 'auto') {
            debugLog('Override: AUTO - returned to normal operation');
            
            // If triggers are not timed out, set lights to correct level
            if (state.timedOut === false) {
              debugLog('Triggers active, setting lights to appropriate level');
              const level = funcs.findCurrentLevel(nodeConfig, nodeWrapper);
              if (level !== null) {
                funcs.controlLights(nodeConfig.lights, level, nodeWrapper, homeAssistant);
                node.status({ fill: "green", shape: "dot", text: `AUTO: ${level}%` });
                debugLog(`Lights set to ${level}% (auto mode with active triggers)`);
              } else {
                node.status({ fill: "blue", shape: "dot", text: "Override: AUTO (normal operation)" });
              }
            } else {
              node.status({ fill: "blue", shape: "dot", text: "Override: AUTO (normal operation)" });
            }
          } else {
            node.warn(`Invalid override value: ${nodeConfig.override}`);
          }
        }
      }
      
      // Send config if requested
      if (sendConfigRequested) {
        fetchMissingStates();
        
        const output = { 
          payload: {
            config: JSON.parse(JSON.stringify(nodeConfig))
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
      
      // Subscribe to away sensor if configured
      if (nodeConfig.awaySensor && nodeConfig.awaySensor.entity_id) {
        const eventTopic = `ha_events:state_changed:${nodeConfig.awaySensor.entity_id}`;
        homeAssistant.eventBus.on(eventTopic, handleStateChange);
        debugLog(`Subscribed to away sensor: ${eventTopic}`);
      }

      const nightSensorText = nodeConfig.nightSensor ? ', 1 night sensor' : '';
      const awaySensorText = nodeConfig.awaySensor ? ', 1 away sensor' : '';
      node.status({ fill: "green", shape: "dot", text: `Monitoring ${nodeConfig.triggers.length} triggers, ${nodeConfig.lights.length} lights${nightSensorText}${awaySensorText}, ${nodeConfig.levels.length} levels` });
      debugLog(`Monitoring ${nodeConfig.triggers.length} triggers, ${nodeConfig.lights.length} lights${nightSensorText}${awaySensorText}, and ${nodeConfig.levels.length} levels`);
      
      // Fetch initial states after a delay to allow HA to connect
      setTimeout(() => {
        debugLog('Fetching initial states after startup delay...');
        fetchMissingStates();
        
        // Apply override after states are fetched
        setTimeout(() => {
          if (nodeConfig.override !== 'auto') {
            debugLog(`Applying override from config: ${nodeConfig.override}`);
            if (nodeConfig.override === 'off') {
              funcs.turnOffAllLights(nodeConfig.lights, nodeWrapper, homeAssistant);
              node.status({ fill: "red", shape: "dot", text: "Override: OFF" });
            } else if (nodeConfig.override === 'on') {
              const level = funcs.findCurrentLevel(nodeConfig, nodeWrapper);
              if (level !== null) {
                funcs.controlLights(nodeConfig.lights, level, nodeWrapper, homeAssistant);
                node.status({ fill: "green", shape: "dot", text: `Override: ON (${level}%)` });
              }
            } else if (typeof nodeConfig.override === 'number') {
              funcs.controlLights(nodeConfig.lights, nodeConfig.override, nodeWrapper, homeAssistant);
              node.status({ fill: "green", shape: "dot", text: `Override: ${nodeConfig.override}%` });
            }
          }
        }, 2000); // Wait 2 more seconds for states to be available
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
      
      // Clear night activation timer
      if (nightActivationTimer) {
        clearTimeout(nightActivationTimer);
        nightActivationTimer = null;
        debugLog('Cleared night activation timer');
      }
      
      // Clear away activation timer
      if (awayActivationTimer) {
        clearTimeout(awayActivationTimer);
        awayActivationTimer = null;
        debugLog('Cleared away activation timer');
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
        
        if (nodeConfig.awaySensor && nodeConfig.awaySensor.entity_id) {
          const eventTopic = `ha_events:state_changed:${nodeConfig.awaySensor.entity_id}`;
          homeAssistant.eventBus.removeListener(eventTopic, handleStateChange);
        }
      }
      node.status({});
    });
  }

  RED.nodes.registerType("ps-strategy-light-saver", StrategyLightSaverNode);
  
  // Add HTTP endpoint to get runtime override state
  RED.httpAdmin.get('/ps-strategy-light-saver/:id/override', function(req, res) {
    const nodeId = req.params.id;
    const node = RED.nodes.getNode(nodeId);
    
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    
    // Get override state from context
    const override = node.context().get('override');
    const overrideEnabled = node.context().get('overrideEnabled');
    const overrideType = node.context().get('overrideType');
    const overrideLevel = node.context().get('overrideLevel');
    
    res.json({
      override: override !== undefined ? override : 'auto',
      overrideEnabled: overrideEnabled !== undefined ? overrideEnabled : false,
      overrideType: overrideType !== undefined ? overrideType : 'on',
      overrideLevel: overrideLevel !== undefined ? overrideLevel : 50
    });
  });
};

module.exports = function (RED) {
  const packageJson = require('../package.json');
  const VERSION = packageJson.version;
  const funcs = require('./strategy-light-saver-functions');
  
  // Timing constants
  const STARTUP_DELAYS = {
    HA_CONNECTION_WAIT: 6000,      // Wait for HA connection (ms)
    STATE_FETCH_WAIT: 2000,        // Wait for states to be available (ms)
    IMMEDIATE_CHECK_WAIT: 1000     // Initial timeout check after restart (ms)
  };
  
  const TIMEOUT_CHECK_INTERVAL = 60000; // Check timeouts every minute (ms)
  
  function StrategyLightSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});
    
    // Store context storage setting
    node.contextStorage = config.contextStorage || "default";

    // Load saved runtime override from context storage
    let runtimeOverride = null;
    try {
      runtimeOverride = node.context().get('override', node.contextStorage);
    } catch (err) {
      // Context storage might not be available (e.g., in tests)
    }
    
    // Use runtime override if available, otherwise use config override
    const override = runtimeOverride !== null && runtimeOverride !== undefined ? runtimeOverride : (config.override || 'auto');

    // Configuration
    const nodeConfig = {
      triggers: Array.isArray(config.triggers) ? config.triggers : [],
      lights: Array.isArray(config.lights) ? config.lights.map(light => ({
        entity_id: typeof light === 'string' ? light : light.entity_id,
        setLevel: light.setLevel || null,
        actualLevel: light.actualLevel || null,
        lastChanged: light.lastChanged || null
      })) : [],
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
    
    // Debug logging function (defined early so other functions can use it)
    const debugLog = function(message) {
      if (nodeConfig.debugLog) {
        node.log(message);
      }
    };
    
    // Save override to context storage (for persistence across restarts)
    const saveOverride = function() {
      try {
        node.context().set('override', nodeConfig.override, node.contextStorage);
        debugLog(`Override saved to context storage: ${nodeConfig.override}`);
      } catch (err) {
        // Silently fail if context storage not available
      }
    };
    
    // Save initial override
    saveOverride();
    
    let nightActivationTimer = null; // Timer for setting lights to night level when night sensor activates
    let awayActivationTimer = null; // Timer for setting lights to away level when away sensor activates
    
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
    
    // Function to handle light state changes
    const handleLightStateChange = function (event) {
      debugLog(`Light state change event received: ${JSON.stringify(event).substring(0, 200)}`);
      
      if (!event || !event.event) {
        debugLog('Invalid event structure');
        return;
      }
      
      const entityId = event.event.entity_id;
      const newState = event.event.new_state;
      
      if (!newState) {
        debugLog(`No new state for ${entityId}`);
        return;
      }
      
      // Find the light in our config
      const light = nodeConfig.lights.find(l => l.entity_id === entityId);
      if (!light) {
        debugLog(`Light ${entityId} not found in config`);
        return;
      }
      
      // Extract brightness level using helper function
      const actualLevel = funcs.extractBrightnessLevel(newState);
      
      // Update light state
      const oldLevel = light.actualLevel;
      light.actualLevel = actualLevel;
      light.lastChanged = newState.last_changed || newState.last_updated;
      
      debugLog(`Light ${entityId} changed from ${oldLevel}% to ${actualLevel}% at ${light.lastChanged}`);
      
      // Send lights list to output
      node.send({
        payload: {
          lights: nodeConfig.lights
        }
      });
      
      debugLog(`Sent lights list to output (${nodeConfig.lights.length} lights)`);
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
      
      // Fetch initial light states
      try {
        const states = homeAssistant.websocket.states;
        if (states && typeof states === 'object') {
          nodeConfig.lights.forEach(light => {
            const stateObj = states[light.entity_id];
            if (stateObj) {
              // Extract brightness level using helper function
              const actualLevel = funcs.extractBrightnessLevel(stateObj);
              light.actualLevel = actualLevel;
              light.lastChanged = stateObj.last_changed || stateObj.last_updated;
              debugLog(`Fetched initial state for light ${light.entity_id}: ${actualLevel}%`);
            } else {
              nodeWrapper.warn(`State not found for light ${light.entity_id}`);
            }
          });
        }
      } catch (err) {
        nodeWrapper.warn(`Failed to fetch light states: ${err.message}`);
      }
      
      // Start timeout check timer if initial timedOut was just set
      if (initialTimedOutWasSet && !timeoutCheckInterval) {
        debugLog('Starting timeout check timer (runs every minute)');
        timeoutCheckInterval = setInterval(checkTimeouts, TIMEOUT_CHECK_INTERVAL);
        
        // Run an immediate check in case lights should already be turned off after restart
        debugLog('Running immediate timeout check after restart');
        setTimeout(() => checkTimeouts(), STARTUP_DELAYS.IMMEDIATE_CHECK_WAIT);
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
          saveOverride();
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
          timeoutCheckInterval = setInterval(checkTimeouts, TIMEOUT_CHECK_INTERVAL);
        }
        
        // Send new config (with updated override)
        node.send({
          payload: {
            newConfig: JSON.parse(JSON.stringify(nodeConfig))
          }
        });
        
        debugLog('Configuration updated via input');
        
        // Apply override actions immediately after config is sent
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
            } else {
              // If we can't determine level, use 100% as default
              funcs.controlLights(nodeConfig.lights, 100, nodeWrapper, homeAssistant);
              node.status({ fill: "green", shape: "dot", text: "Override: ON (100%)" });
              debugLog('Override: ON - lights set to 100% (default)');
            }
          } else if (typeof nodeConfig.override === 'number' && nodeConfig.override >= 0 && nodeConfig.override <= 100) {
            funcs.controlLights(nodeConfig.lights, nodeConfig.override, nodeWrapper, homeAssistant);
            node.status({ fill: "green", shape: "dot", text: `Override: ${nodeConfig.override}%` });
            debugLog(`Override: ${nodeConfig.override}% - lights set to ${nodeConfig.override}%`);
          } else if (nodeConfig.override === 'auto') {
            debugLog('Override: AUTO - returned to normal operation');
            node.status({ fill: "blue", shape: "dot", text: "Override: AUTO" });
            
            // If triggers are not timed out, set lights to correct level immediately
            if (state.timedOut === false) {
              debugLog('Triggers active, setting lights to appropriate level');
              const level = funcs.findCurrentLevel(nodeConfig, nodeWrapper);
              if (level !== null) {
                funcs.controlLights(nodeConfig.lights, level, nodeWrapper, homeAssistant);
                node.status({ fill: "green", shape: "dot", text: `AUTO: ${level}%` });
                debugLog(`Lights set to ${level}% (auto mode with active triggers)`);
              }
            }
          } else {
            node.warn(`Invalid override value: ${nodeConfig.override}`);
          }
        }
      }
      
      // Handle level input (different from override - respects timeout)
      if (payload.level !== undefined) {
        const level = payload.level;
        debugLog(`Level input received: ${level}`);
        
        if (level === 'off') {
          funcs.turnOffAllLights(nodeConfig.lights, nodeWrapper, homeAssistant);
          debugLog('Level: OFF - lights turned off');
        } else if (level === 'on') {
          const currentLevel = funcs.findCurrentLevel(nodeConfig, nodeWrapper);
          if (currentLevel !== null) {
            funcs.controlLights(nodeConfig.lights, currentLevel, nodeWrapper, homeAssistant);
            debugLog(`Level: ON - lights set to ${currentLevel}%`);
          } else {
            node.warn('Level: ON - could not determine level');
          }
        } else if (level === 'auto') {
          // Check timeout and set accordingly
          if (state.timedOut === false) {
            const currentLevel = funcs.findCurrentLevel(nodeConfig, nodeWrapper);
            if (currentLevel !== null) {
              funcs.controlLights(nodeConfig.lights, currentLevel, nodeWrapper, homeAssistant);
              debugLog(`Level: AUTO - lights set to ${currentLevel}% (triggers active)`);
            }
          } else {
            funcs.turnOffAllLights(nodeConfig.lights, nodeWrapper, homeAssistant);
            debugLog('Level: AUTO - lights turned off (timed out)');
          }
        } else if (typeof level === 'number' && level >= 0 && level <= 100) {
          funcs.controlLights(nodeConfig.lights, level, nodeWrapper, homeAssistant);
          debugLog(`Level: ${level}% - lights set to ${level}%`);
        } else {
          node.warn(`Invalid level value: ${level}`);
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
      
      // Subscribe to light state changes
      nodeConfig.lights.forEach((light) => {
        const entityId = light.entity_id;
        const eventTopic = `ha_events:state_changed:${entityId}`;
        homeAssistant.eventBus.on(eventTopic, handleLightStateChange);
        debugLog(`Subscribed to light: ${eventTopic}`);
      });

      const nightSensorText = nodeConfig.nightSensor ? ', 1 night sensor' : '';
      const awaySensorText = nodeConfig.awaySensor ? ', 1 away sensor' : '';
      node.status({ fill: "green", shape: "dot", text: `Monitoring ${nodeConfig.triggers.length} triggers, ${nodeConfig.lights.length} lights${nightSensorText}${awaySensorText}, ${nodeConfig.levels.length} levels` });
      debugLog(`Monitoring ${nodeConfig.triggers.length} triggers, ${nodeConfig.lights.length} lights${nightSensorText}${awaySensorText}, and ${nodeConfig.levels.length} levels`);
      
      // Fetch initial states after a delay to allow HA to connect
      setTimeout(() => {
        debugLog('Fetching initial states after startup delay...');
        fetchMissingStates();
        
        // Apply override immediately after fetching states
        setTimeout(() => {
          if (nodeConfig.override !== 'auto') {
            debugLog(`Applying override from config: ${nodeConfig.override}`);
            if (nodeConfig.override === 'off') {
              funcs.turnOffAllLights(nodeConfig.lights, nodeWrapper, homeAssistant);
              node.status({ fill: "red", shape: "dot", text: "Override: OFF" });
              debugLog('Override: OFF applied on startup');
            } else if (nodeConfig.override === 'on') {
              const level = funcs.findCurrentLevel(nodeConfig, nodeWrapper);
              if (level !== null) {
                funcs.controlLights(nodeConfig.lights, level, nodeWrapper, homeAssistant);
                node.status({ fill: "green", shape: "dot", text: `Override: ON (${level}%)` });
                debugLog(`Override: ON applied on startup - ${level}%`);
              } else {
                node.warn('Override ON on startup: Could not determine level');
                node.status({ fill: "yellow", shape: "dot", text: "Override: ON (no level)" });
              }
            } else if (typeof nodeConfig.override === 'number') {
              funcs.controlLights(nodeConfig.lights, nodeConfig.override, nodeWrapper, homeAssistant);
              node.status({ fill: "green", shape: "dot", text: `Override: ${nodeConfig.override}%` });
              debugLog(`Override: ${nodeConfig.override}% applied on startup`);
            }
          }
        }, STARTUP_DELAYS.STATE_FETCH_WAIT);
      }, STARTUP_DELAYS.HA_CONNECTION_WAIT);
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
        
        // Unsubscribe from light state changes
        nodeConfig.lights.forEach((light) => {
          const entityId = light.entity_id;
          const eventTopic = `ha_events:state_changed:${entityId}`;
          homeAssistant.eventBus.removeListener(eventTopic, handleLightStateChange);
        });
      }
      node.status({});
    });
  }

  RED.nodes.registerType("ps-strategy-light-saver", StrategyLightSaverNode);
};

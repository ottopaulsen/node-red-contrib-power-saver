module.exports = function (RED) {
  const packageJson = require('../package.json');
  const VERSION = packageJson.version;
  
  function StrategyLightSaverNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    const triggers = Array.isArray(config.triggers) ? config.triggers : [];
    const lights = Array.isArray(config.lights) ? config.lights : [];
    const lightTimeout = config.lightTimeout !== undefined ? config.lightTimeout : 10;
    const nightSensor = config.nightSensor || null;
    const nightLevel = config.nightLevel !== undefined ? config.nightLevel : null; // Level used when night sensor is on
    const levels = Array.isArray(config.levels) ? config.levels : [];
    
    let timedOut = undefined; // Tracks if all triggers are currently off
    let timeoutCheckInterval = null; // Timer for checking timeouts every minute

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
        
        // If trigger turned on and timedOut is true, control the lights
        if (newState.state === 'on' && timedOut === true) {
          node.log(`Trigger ${entityId} turned on while timedOut=true, activating lights`);
          timedOut = false; // Reset timedOut after activating lights
          
          const level = findCurrentLevel();
          if (level !== null) {
            controlLights(level);
          }
        }
        
        // Update timedOut status: if any trigger is on, timedOut = false
        if (newState.state === 'on') {
          timedOut = false;
        }
        // Note: When triggers turn off, we don't immediately set timedOut=true
        // The checkTimeouts function will set it to true after the timeout period has elapsed
        
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
    
    // Function to find the correct light level based on time and night sensor
    const findCurrentLevel = function() {
      // If night sensor is on and nightLevel is set, use that
      if (nightSensor && nightSensor.state === 'on' && nightLevel !== null && nightLevel !== undefined) {
        node.log(`Using night level: ${nightLevel}%`);
        return nightLevel;
      }
      
      // Otherwise, find level from levels list based on current time
      if (!levels || levels.length === 0) {
        node.warn('No levels defined');
        return null;
      }
      
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes since midnight
      
      // Sort levels by fromTime
      const sortedLevels = levels.slice().sort((a, b) => {
        const [aHour, aMin] = a.fromTime.split(':').map(Number);
        const [bHour, bMin] = b.fromTime.split(':').map(Number);
        const aMinutes = aHour * 60 + aMin;
        const bMinutes = bHour * 60 + bMin;
        return aMinutes - bMinutes;
      });
      
      // Find the latest level that started before current time
      let selectedLevel = null;
      for (let i = sortedLevels.length - 1; i >= 0; i--) {
        const [hour, min] = sortedLevels[i].fromTime.split(':').map(Number);
        const levelTime = hour * 60 + min;
        
        if (levelTime <= currentTime) {
          selectedLevel = sortedLevels[i].level;
          node.log(`Found level ${selectedLevel}% from ${sortedLevels[i].fromTime}`);
          break;
        }
      }
      
      // If no level found (current time is before all levels), use the last level (wraps from previous day)
      if (selectedLevel === null && sortedLevels.length > 0) {
        selectedLevel = sortedLevels[sortedLevels.length - 1].level;
        node.log(`Using last level ${selectedLevel}% (wrapped from previous day)`);
      }
      
      return selectedLevel;
    };
    
    // Function to control lights
    const controlLights = function(level) {
      if (level === null || level === undefined) {
        node.warn('Cannot control lights: no valid level found');
        return;
      }
      
      node.log(`Controlling lights with level: ${level}%`);
      
      lights.forEach(light => {
        if (!light.entity_id) return;
        
        const entityId = light.entity_id;
        const domain = entityId.split('.')[0];
        
        if (domain === 'switch') {
          // For switches: turn off if level is 0, on if level > 0
          const service = level === 0 ? 'turn_off' : 'turn_on';
          node.log(`Calling ${domain}.${service} for ${entityId}`);
          
          homeAssistant.websocket.send({
            type: 'call_service',
            domain: domain,
            service: service,
            service_data: {
              entity_id: entityId
            }
          });
        } else if (domain === 'light') {
          // For lights: set brightness percentage
          if (level === 0) {
            node.log(`Calling ${domain}.turn_off for ${entityId}`);
            homeAssistant.websocket.send({
              type: 'call_service',
              domain: domain,
              service: 'turn_off',
              service_data: {
                entity_id: entityId
              }
            });
          } else {
            node.log(`Calling ${domain}.turn_on for ${entityId} with brightness ${level}%`);
            homeAssistant.websocket.send({
              type: 'call_service',
              domain: domain,
              service: 'turn_on',
              service_data: {
                entity_id: entityId,
                brightness_pct: level
              }
            });
          }
        }
      });
    };
    
    // Function to turn off all lights
    const turnOffAllLights = function() {
      node.log('Turning off all lights (timeout reached)');
      
      lights.forEach(light => {
        if (!light.entity_id) return;
        
        const entityId = light.entity_id;
        const domain = entityId.split('.')[0];
        
        node.log(`Calling ${domain}.turn_off for ${entityId}`);
        homeAssistant.websocket.send({
          type: 'call_service',
          domain: domain,
          service: 'turn_off',
          service_data: {
            entity_id: entityId
          }
        });
      });
    };
    
    // Function to check timeouts every minute
    const checkTimeouts = function() {
      // Check if any trigger is on
      const anyOn = triggers.some(t => t.state === 'on');
      
      if (anyOn) {
        node.log('At least one trigger is on, no timeout check needed');
        return;
      }
      
      // All triggers are off, check if they've been off long enough
      node.log('All triggers are off, checking timeouts...');
      
      const now = new Date();
      let allTimedOut = true;
      
      for (const trigger of triggers) {
        if (!trigger.entity_id) continue;
        
        // Get timeout for this trigger (use specific timeout or fall back to lightTimeout)
        const timeoutMinutes = trigger.timeoutMinutes !== undefined ? trigger.timeoutMinutes : lightTimeout;
        
        // If trigger has no state or lastChanged, we can't check timeout
        if (!trigger.state || !trigger.lastChanged) {
          node.log(`Trigger ${trigger.entity_id} has no state/lastChanged, skipping`);
          allTimedOut = false;
          continue;
        }
        
        // If trigger is on, not timed out
        if (trigger.state === 'on') {
          allTimedOut = false;
          continue;
        }
        
        // Calculate how long the trigger has been off
        const lastChangedTime = new Date(trigger.lastChanged);
        const minutesOff = (now - lastChangedTime) / 1000 / 60;
        
        node.log(`Trigger ${trigger.entity_id}: off for ${minutesOff.toFixed(1)} minutes, timeout is ${timeoutMinutes} minutes`);
        
        if (minutesOff < timeoutMinutes) {
          allTimedOut = false;
          node.log(`Trigger ${trigger.entity_id} has not timed out yet`);
        }
      }
      
      if (allTimedOut && triggers.length > 0) {
        node.log('All triggers have timed out, turning off lights');
        turnOffAllLights();
        timedOut = true;
        node.status({ fill: "yellow", shape: "ring", text: "Timed out - lights off" });
      }
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
      
      // After fetching states, determine initial timedOut value
      if (timedOut === undefined && triggers.length > 0) {
        const allOff = triggers.every(t => t.state === 'off' || !t.state);
        timedOut = allOff;
        node.log(`Initial timedOut set to ${timedOut} (all triggers ${allOff ? 'off' : 'not all off'})`);
        
        // Start timeout check timer (runs every minute)
        if (!timeoutCheckInterval) {
          node.log('Starting timeout check timer (runs every minute)');
          timeoutCheckInterval = setInterval(checkTimeouts, 60000); // 60000ms = 1 minute
        }
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
            triggers: triggers,
            lights: lights,
            lightTimeout: lightTimeout,
            nightSensor: nightSensor,
            nightLevel: nightLevel,
            levels: levels,
            timedOut: timedOut
          }
        };
        
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
      // Clear timeout check interval
      if (timeoutCheckInterval) {
        clearInterval(timeoutCheckInterval);
        timeoutCheckInterval = null;
        node.log('Cleared timeout check timer');
      }
      
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

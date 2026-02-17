// Business logic functions for light-saver node
// These functions are exported for testing

/**
 * Debug logging wrapper - only logs if debugLog is enabled in config
 * @param {object} config - Configuration object with debugLog boolean
 * @param {object} node - Node-RED node object for logging
 * @param {string} message - Message to log
 */
function debugLog(config, node, message) {
  if (config && config.debugLog === true) {
    node.log(message);
  }
}

/**
 * Parse a timestamp string as UTC, handling timezone offsets
 * Home Assistant may return timestamps with or without 'Z' or timezone offsets like +00:00
 * @param {string} timestamp - ISO timestamp string
 * @returns {Date} - Date object parsed as UTC
 */
function parseUTCTimestamp(timestamp) {
  if (!timestamp) return null;
  // If timestamp already has 'Z' or a timezone offset (+HH:MM or -HH:MM), use as-is
  if (timestamp.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(timestamp)) {
    return new Date(timestamp);
  }
  // Otherwise, add 'Z' to force UTC parsing
  return new Date(timestamp + 'Z');
}

/**
 * Extract brightness level from Home Assistant state object
 * @param {object} stateObj - State object from Home Assistant
 * @returns {number|null} - Brightness level 0-100, or null if state is unknown
 */
function extractBrightnessLevel(stateObj) {
  if (!stateObj) return null;
  
  if (stateObj.state === 'off') {
    return 0;
  } else if (stateObj.state === 'on') {
    // Check if it has brightness attribute
    if (stateObj.attributes && stateObj.attributes.brightness !== undefined) {
      // Convert 0-255 to 0-100
      return Math.round((stateObj.attributes.brightness / 255) * 100);
    } else {
      // Switch without brightness
      return 100;
    }
  }
  
  return null;
}

/**
 * Check if a sensor is currently active based on state and invert setting
 * @param {object} sensor - Sensor object with state property
 * @param {boolean} invertFlag - Whether to invert the sensor logic
 * @returns {boolean} - True if sensor is active, false otherwise
 */
function isSensorActive(sensor, invertFlag) {
  if (!sensor || sensor.state === undefined || sensor.state === null) {
    return false;
  }
  
  const sensorState = sensor.state;
  const isOn = (sensorState === 'on' || sensorState === true || sensorState === 'true');
  
  // If inverted, active when sensor is off
  return invertFlag ? !isOn : isOn;
}

/**
 * Check if it's currently night mode based on night sensor state and invert setting
 * @param {object} config - Configuration object with nightSensor
 * @returns {boolean} - True if it's night mode, false otherwise
 */
function isNightMode(config) {
  return isSensorActive(config.nightSensor, config.nightSensor?.invert);
}

/**
 * Check if it's currently away mode based on away sensor state and invert setting
 * @param {object} config - Configuration object with awaySensor
 * @returns {boolean} - True if it's away mode, false otherwise
 */
function isAwayMode(config) {
  return isSensorActive(config.awaySensor, config.awaySensor?.invert);
}

/**
 * Check if brightness allows lights to turn on based on brightness sensor and limit
 * @param {object} config - Configuration object with brightnessSensor
 * @returns {boolean} - True if lights are allowed to turn on, false otherwise
 */
function isBrightnessAllowingLights(config) {
  if (!config.brightnessSensor || !config.brightnessSensor.entity_id) {
    return true; // No brightness limit configured, always allow
  }
  
  if (config.brightnessSensor.limit === null || config.brightnessSensor.limit === undefined) {
    return true; // No limit set, always allow
  }
  
  if (config.brightnessSensor.state === null || config.brightnessSensor.state === undefined) {
    return true; // No state yet, allow (fail-open)
  }
  
  const brightness = parseFloat(config.brightnessSensor.state);
  if (isNaN(brightness)) {
    return true; // Invalid brightness value, allow (fail-open)
  }
  
  const limit = config.brightnessSensor.limit;
  const mode = config.brightnessSensor.mode || 'max';
  
  if (mode === 'min') {
    // Lights allowed when brightness is ABOVE limit (dark enough)
    return brightness > limit;
  } else {
    // Lights allowed when brightness is BELOW limit (default: max mode)
    return brightness < limit;
  }
}

/**
 * Handle state change events from Home Assistant
 * @param {object} event - The state change event from HA
 * @param {object} config - Configuration object with triggers, lights, nightSensor, etc.
 * @param {object} state - Mutable state object with timedOut property
 * @param {object} node - Node-RED node object for logging
 * @param {object} homeAssistant - Home Assistant integration object
 * @param {object} clock - Clock abstraction for getting current time (for testing)
 */
function handleStateChange(event, config, state, node, homeAssistant, clock = null) {
  const now = clock ? clock.now() : new Date();
  
    debugLog(config, node, "State change event received: " + JSON.stringify(event).substring(0, 200));
  
  if (!event || !event.event) return;
  
  const entityId = event.event.entity_id;
  const newState = event.event.new_state;
  
  if (!entityId || !newState) {
    node.warn(`Event missing entity_id or new_state: ${JSON.stringify(event).substring(0, 100)}`);
    return;
  }
  
    debugLog(config, node, `Processing state change for ${entityId}: ${newState.state}`);
  
  const timestamp = now.toISOString().substring(0, 19); // Format: yyyy-mm-ddTHH:MM:SS
  const timeOnly = now.toISOString().substring(11, 19); // Format: HH:MM:SS
  
  // Check if it's a trigger
  const trigger = config.triggers.find(t => t.entity_id === entityId);
  if (trigger) {
    trigger.lastChanged = timestamp;
    trigger.state = newState.state;
    
    debugLog(config, node, `Updated trigger ${entityId}: state=${trigger.state}, lastChanged=${trigger.lastChanged}`);
    
    // If trigger turned on and timedOut is true, activate lights
    if (newState.state === 'on' && state.timedOut === true) {
    debugLog(config, node, `Trigger ${entityId} turned on while timedOut=true, checking brightness and activating lights`);
      state.timedOut = false; // Reset timedOut after activating lights
      
      // Check brightness limit before turning on lights
      if (isBrightnessAllowingLights(config)) {
        const level = findCurrentLevel(config, node, clock);
        if (level !== null) {
          controlLights(config, config.lights, level, node, homeAssistant);
        }
      } else {
    debugLog(config, node, 'Brightness limit prevents lights from turning on');
      }
    }
    
    
    // Update timedOut status: if any trigger is on, timedOut = false
    if (newState.state === 'on') {
      state.timedOut = false;
    }
    
    node.status({ 
      fill: "green", 
      shape: "dot", 
      text: `${entityId}: ${newState.state} - updated ${timeOnly}` 
    });
    return;
  }
  
  // Check if it's the night sensor
  if (config.nightSensor && config.nightSensor.entity_id === entityId) {
    const wasNightMode = isNightMode(config); // Check if it was night mode before update
    config.nightSensor.lastChanged = timestamp;
    config.nightSensor.state = newState.state;
    
    debugLog(config, node, `Updated night sensor ${entityId}: state=${config.nightSensor.state}, lastChanged=${config.nightSensor.lastChanged}`);
    
    node.status({ 
      fill: "green", 
      shape: "dot", 
      text: `Night: ${newState.state} - updated ${timeOnly}` 
    });
    
    // Return a signal that night sensor turned on/activated (considering invert setting)
    const isNowNightMode = isNightMode(config);
    if (!wasNightMode && isNowNightMode) {
      return { nightSensorTurnedOn: true };
    }
    return;
  }
  
  // Check if it's the away sensor
  if (config.awaySensor && config.awaySensor.entity_id === entityId) {
    const wasAwayMode = isAwayMode(config); // Check if it was away mode before update
    config.awaySensor.lastChanged = timestamp;
    config.awaySensor.state = newState.state;
    
    debugLog(config, node, `Updated away sensor ${entityId}: state=${config.awaySensor.state}, lastChanged=${config.awaySensor.lastChanged}`);
    
    node.status({ 
      fill: "green", 
      shape: "dot", 
      text: `Away: ${newState.state} - updated ${timeOnly}` 
    });
    
    // Return a signal that away sensor turned on/activated (considering invert setting)
    const isNowAwayMode = isAwayMode(config);
    if (!wasAwayMode && isNowAwayMode) {
      return { awaySensorTurnedOn: true };
    }
    return;
  }
  
  // Check if it's the brightness sensor
  if (config.brightnessSensor && config.brightnessSensor.entity_id === entityId) {
    const wasBrightnessAllowing = isBrightnessAllowingLights(config); // Check before update
    const oldBrightness = config.brightnessSensor.state;
    config.brightnessSensor.lastChanged = timestamp;
    config.brightnessSensor.state = newState.state;
    
    debugLog(config, node, `Updated brightness sensor ${entityId}: state=${config.brightnessSensor.state}, lastChanged=${config.brightnessSensor.lastChanged}`);
    
    node.status({ 
      fill: "green", 
      shape: "dot", 
      text: `Brightness: ${newState.state} - updated ${timeOnly}` 
    });
    
    // Check if brightness crossed threshold to allow lights
    const isNowBrightnessAllowing = isBrightnessAllowingLights(config);
    if (!wasBrightnessAllowing && isNowBrightnessAllowing) {
      // Brightness crossed threshold - lights are now allowed
      // If lights are off and there was motion within timeout (timedOut is false), turn lights on
      if (state.timedOut === false) {
    debugLog(config, node, 'Brightness crossed threshold and motion detected within timeout, turning lights on');
        const level = findCurrentLevel(config, node, clock);
        if (level !== null) {
          controlLights(config, config.lights, level, node, homeAssistant);
        }
      }
    } else if (wasBrightnessAllowing && !isNowBrightnessAllowing) {
      // Brightness crossed threshold - lights are no longer allowed
      // We don't turn lights off here, let the timeout mechanism handle it
    debugLog(config, node, 'Brightness crossed threshold, lights no longer allowed to turn on (but staying on if already on)');
    }
    
    return;
  }
  
  node.warn(`Received state change for ${entityId} but not found in triggers, nightSensor, awaySensor, or brightnessSensor`);
}

/**
 * Find the level config object for the current time
 * @param {object} config - Configuration object with levels
 * @param {object} clock - Clock abstraction for getting current time (for testing)
 * @returns {object|null} The level config object or null if not found
 */
function findLevelConfig(config, clock = null) {
  const now = clock ? clock.now() : new Date();
  
  if (!config.levels || config.levels.length === 0) {
    return null;
  }
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Sort levels by fromTime
  const sortedLevels = config.levels.slice().sort((a, b) => {
    const [aHour, aMin] = a.fromTime.split(':').map(Number);
    const [bHour, bMin] = b.fromTime.split(':').map(Number);
    const aMinutes = aHour * 60 + aMin;
    const bMinutes = bHour * 60 + bMin;
    return aMinutes - bMinutes;
  });
  
  // Find the latest level that started before current time
  for (let i = sortedLevels.length - 1; i >= 0; i--) {
    const [hour, min] = sortedLevels[i].fromTime.split(':').map(Number);
    const levelTime = hour * 60 + min;
    
    if (levelTime <= currentTime) {
      return sortedLevels[i];
    }
  }
  
  return null;
}

/**
 * Find the appropriate light level based on time and night sensor
 * @param {object} config - Configuration object with awaySensor, nightSensor, levels
 * @param {object} node - Node-RED node object for logging
 * @param {object} clock - Clock abstraction for getting current time (for testing)
 * @returns {number|null} The level (0-100) or null if no level found
 */
function findCurrentLevel(config, node, clock = null) {
  const now = clock ? clock.now() : new Date();
  
  // Priority: Away sensor > Night sensor > Time-based levels
  
  // If away sensor is active and awayLevel is set, use that
  if (isAwayMode(config) && config.awaySensor?.level !== null && config.awaySensor?.level !== undefined) {
    debugLog(config, node, `Using away level: ${config.awaySensor.level}%`);
    return config.awaySensor.level;
  }
  
  // If night sensor is active and nightLevel is set, use that
  if (isNightMode(config) && config.nightSensor?.level !== null && config.nightSensor?.level !== undefined) {
    debugLog(config, node, `Using night level: ${config.nightSensor.level}%`);
    return config.nightSensor.level;
  }
  
  // Otherwise, find level from levels list based on current time
  if (!config.levels || config.levels.length === 0) {
    node.warn('No levels defined');
    return null;
  }
  
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes since midnight
  
  // Sort levels by fromTime
  const sortedLevels = config.levels.slice().sort((a, b) => {
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
      debugLog(config, node, `Found level ${selectedLevel}% from ${sortedLevels[i].fromTime}`);
      break;
    }
  }
  
  // If no level found (current time is before all levels), use the last level (wraps from previous day)
  if (selectedLevel === null && sortedLevels.length > 0) {
    selectedLevel = sortedLevels[sortedLevels.length - 1].level;
    debugLog(config, node, `Using last level ${selectedLevel}% (wrapped from previous day)`);
  }
  
  return selectedLevel;
}

/**
 * Control lights by sending commands to Home Assistant
 * @param {object} config - Configuration object with debugLog flag
 * @param {array} lights - Array of light entities
 * @param {number} level - Level to set (0-100)
 * @param {object} node - Node-RED node object for logging
 * @param {object} homeAssistant - Home Assistant integration object
 */
function controlLights(config, lights, level, node, homeAssistant) {
  if (level === null || level === undefined) {
    node.warn('Cannot control lights: no valid level found');
    return;
  }
  debugLog(config, node, `Controlling lights with level: ${level}%`);
  
  lights.forEach(light => {
    const entityId = light.entity_id;
    const domain = entityId.split('.')[0];
    
    // Store the level we're setting
    light.setLevel = level;
    
    if (domain === 'switch') {
      // For switches: turn off if level is 0, on if level > 0
      const service = level === 0 ? 'turn_off' : 'turn_on';
      debugLog(config, node, `Calling ${domain}.${service} for ${entityId}`);
      
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
        debugLog(config, node, `Calling ${domain}.turn_off for ${entityId}`);
        homeAssistant.websocket.send({
          type: 'call_service',
          domain: domain,
          service: 'turn_off',
          service_data: {
            entity_id: entityId
          }
        });
      } else {
        debugLog(config, node, `Calling ${domain}.turn_on for ${entityId} with brightness ${level}%`);
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
}

/**
 * Turn off all lights
 * @param {object} config - Configuration object with debugLog flag
 * @param {array} lights - Array of light entities
 * @param {object} node - Node-RED node object for logging
 * @param {object} homeAssistant - Home Assistant integration object
 */
function turnOffAllLights(config, lights, node, homeAssistant) {
    debugLog(config, node, 'Turning off all lights (timeout reached)');
  
  lights.forEach(light => {
    const entityId = light.entity_id;
    const domain = entityId.split('.')[0];
    
    // Store that we're setting level to 0
    light.setLevel = 0;
    
    debugLog(config, node, `Calling ${domain}.turn_off for ${entityId}`);
    homeAssistant.websocket.send({
      type: 'call_service',
      domain: domain,
      service: 'turn_off',
      service_data: {
        entity_id: entityId
      }
    });
  });
}

/**
 * Check if triggers have timed out and turn off lights if needed
 * @param {object} config - Configuration object with triggers, lights, lightTimeout
 * @param {object} state - Mutable state object with timedOut property
 * @param {object} node - Node-RED node object for logging
 * @param {object} homeAssistant - Home Assistant integration object
 * @param {object} clock - Clock abstraction for getting current time (for testing)
 */
function checkTimeouts(config, state, node, homeAssistant, clock = null) {
  const now = clock ? clock.now() : new Date();
  
  // Check if any trigger is on
  const anyOn = config.triggers.some(t => t.state === 'on');
  
  if (anyOn) {
    debugLog(config, node, 'At least one trigger is on, no timeout check needed');
    return;
  }
  
  // All triggers are off, check if they've been off long enough
    debugLog(config, node, 'All triggers are off, checking timeouts...');
  
  let allTimedOut = true;
  
  for (const trigger of config.triggers) {
    // Get timeout for this trigger (use specific timeout or fall back to lightTimeout)
    const timeoutMinutes = trigger.timeoutMinutes !== undefined ? trigger.timeoutMinutes : config.lightTimeout;
    
    // If trigger has no state or lastChanged, we can't check timeout
    if (!trigger.state || !trigger.lastChanged) {
    debugLog(config, node, `Trigger ${trigger.entity_id} has no state/lastChanged, skipping`);
      allTimedOut = false;
      continue;
    }
    
    // If trigger is on, not timed out
    if (trigger.state === 'on') {
      allTimedOut = false;
      continue;
    }
    
    // Calculate how long the trigger has been off
    const lastChangedTime = parseUTCTimestamp(trigger.lastChanged);
    const minutesOff = (now - lastChangedTime) / 1000 / 60;
    
    debugLog(config, node, `Trigger ${trigger.entity_id}: off for ${minutesOff.toFixed(1)} minutes, timeout is ${timeoutMinutes} minutes`);
    
    if (minutesOff < timeoutMinutes) {
      allTimedOut = false;
    debugLog(config, node, `Trigger ${trigger.entity_id} has not timed out yet`);
    }
  }
  
  if (allTimedOut && config.triggers.length > 0) {
    debugLog(config, node, 'All triggers have timed out, turning off lights');
    turnOffAllLights(config, config.lights, node, homeAssistant);
    state.timedOut = true;
    node.status({ fill: "yellow", shape: "ring", text: "Timed out - lights off" });
  }
  
  // Check for immediate levels when motion is detected (timedOut = false)
  if (!state.timedOut && !allTimedOut) {
    const levelConfig = findLevelConfig(config, clock);
    // Only apply immediate level if this is a NEW immediate period (fromTime changed)
    if (levelConfig && levelConfig.immediate === true && levelConfig.fromTime !== state.lastImmediateTime && isBrightnessAllowingLights(config)) {
      const currentLevel = findCurrentLevel(config, node, clock);
      if (currentLevel !== null) {
    debugLog(config, node, `Immediate level ${currentLevel}% found for time ${levelConfig.fromTime}, applying...`);
        controlLights(config, config.lights, currentLevel, node, homeAssistant);
        state.lastImmediateTime = levelConfig.fromTime; // Mark this immediate period as applied
      }
    }
  } else if (state.timedOut) {
    // Reset lastImmediateTime when timeout occurs (next immediate period will apply)
    state.lastImmediateTime = null;
  }
}

/**
 * Fetch current states from Home Assistant for entities that don't have state yet
 * @param {object} config - Configuration object with triggers, nightSensor, lightTimeout
 * @param {object} state - Mutable state object with timedOut property
 * @param {object} node - Node-RED node object for logging
 * @param {object} homeAssistant - Home Assistant integration object
 * @param {object} clock - Clock abstraction for getting current time (for testing)
 * @returns {boolean} True if initial timedOut value was set, false otherwise
 */
function fetchMissingStates(config, state, node, homeAssistant, clock = null) {
  const entitiesToFetch = [];
  
  // Check triggers
  config.triggers.forEach(trigger => {
    if (!trigger.state) {
      entitiesToFetch.push({ id: trigger.entity_id, type: 'trigger' });
    }
  });
  
  // Check night sensor
  if (config.nightSensor && !config.nightSensor.state) {
    entitiesToFetch.push({ id: config.nightSensor.entity_id, type: 'nightSensor' });
  }
  
  // Check away sensor
  if (config.awaySensor && !config.awaySensor.state) {
    entitiesToFetch.push({ id: config.awaySensor.entity_id, type: 'awaySensor' });
  }
  
  // Check brightness sensor
  if (config.brightnessSensor && !config.brightnessSensor.state) {
    entitiesToFetch.push({ id: config.brightnessSensor.entity_id, type: 'brightnessSensor' });
  }
  
  if (entitiesToFetch.length === 0) {
    debugLog(config, node, 'All entities already have states');
  } else {
    debugLog(config, node, `Fetching states for ${entitiesToFetch.length} entities: ${entitiesToFetch.map(e => e.id).join(', ')}`);
    
    try {
      // Access states from the websocket - it's stored as a flat object
      const states = homeAssistant.websocket.states;
    debugLog(config, node, `States object type: ${typeof states}, keys count: ${states ? Object.keys(states).length : 0}`);
      
      if (states && typeof states === 'object') {
        entitiesToFetch.forEach(entity => {
          const stateObj = states[entity.id];
    debugLog(config, node, `Looking for ${entity.id}, found: ${stateObj ? 'yes' : 'no'}`);
          
          if (stateObj) {
            if (entity.type === 'trigger') {
              const trigger = config.triggers.find(t => t.entity_id === entity.id);
              if (trigger) {
                trigger.state = stateObj.state;
                trigger.lastChanged = stateObj.last_changed || stateObj.last_updated;
    debugLog(config, node, `Fetched state for trigger ${entity.id}: ${stateObj.state}`);
              }
            } else if (entity.type === 'nightSensor') {
              config.nightSensor.state = stateObj.state;
              config.nightSensor.lastChanged = stateObj.last_changed || stateObj.last_updated;
    debugLog(config, node, `Fetched state for night sensor ${entity.id}: ${stateObj.state}`);
            } else if (entity.type === 'awaySensor') {
              config.awaySensor.state = stateObj.state;
              config.awaySensor.lastChanged = stateObj.last_changed || stateObj.last_updated;
    debugLog(config, node, `Fetched state for away sensor ${entity.id}: ${stateObj.state}`);
            } else if (entity.type === 'brightnessSensor') {
              config.brightnessSensor.state = stateObj.state;
              config.brightnessSensor.lastChanged = stateObj.last_changed || stateObj.last_updated;
    debugLog(config, node, `Fetched state for brightness sensor ${entity.id}: ${stateObj.state}`);
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
  }
  
  // After fetching states, determine initial timedOut value if not yet set
  if (state.timedOut === undefined && config.triggers.length > 0) {
    const now = clock ? clock.now() : new Date();
    let allTimedOut = true;
    
    // Check each trigger to see if it has actually timed out
    for (const trigger of config.triggers) {
      // If any trigger is ON, not timed out
      if (trigger.state === 'on') {
        allTimedOut = false;
    debugLog(config, node, `Trigger ${trigger.entity_id} is ON, not timed out`);
        break;
      }
      
      // If trigger is OFF, check how long it's been off
      if (trigger.state === 'off' && trigger.lastChanged) {
        const timeoutMinutes = trigger.timeoutMinutes !== undefined ? trigger.timeoutMinutes : config.lightTimeout;
        const lastChangedTime = parseUTCTimestamp(trigger.lastChanged);
        const minutesOff = (now - lastChangedTime) / 1000 / 60;
        
        if (minutesOff < timeoutMinutes) {
          allTimedOut = false;
    debugLog(config, node, `Trigger ${trigger.entity_id} off for ${minutesOff.toFixed(1)} min, timeout is ${timeoutMinutes} min - NOT timed out yet`);
          break;
        } else {
    debugLog(config, node, `Trigger ${trigger.entity_id} off for ${minutesOff.toFixed(1)} min, timeout is ${timeoutMinutes} min - timed out`);
        }
      } else if (!trigger.state) {
        // No state info, can't determine timeout - assume not timed out to be safe
        allTimedOut = false;
    debugLog(config, node, `Trigger ${trigger.entity_id} has no state, assuming not timed out`);
        break;
      }
    }
    
    state.timedOut = allTimedOut;
    debugLog(config, node, `Initial timedOut set to ${state.timedOut} (all triggers actually timed out: ${allTimedOut})`);
    
    // If motion is detected at startup (timedOut is false), turn lights on
    if (!allTimedOut) {
    debugLog(config, node, 'Motion detected at startup, turning lights on');
      const level = findCurrentLevel(config, node, clock);
      if (level !== null && isBrightnessAllowingLights(config)) {
        controlLights(config, config.lights, level, node, homeAssistant);
    debugLog(config, node, `Lights turned on to ${level}% at startup (motion detected)`);
      }
    }
    
    return true; // Indicates that initial timedOut was set
  }
  
  return false;
}

module.exports = {
  parseUTCTimestamp,
  extractBrightnessLevel,
  isSensorActive,
  isNightMode,
  isAwayMode,
  isBrightnessAllowingLights,
  handleStateChange,
  findCurrentLevel,
  findLevelConfig,
  controlLights,
  turnOffAllLights,
  checkTimeouts,
  fetchMissingStates
};

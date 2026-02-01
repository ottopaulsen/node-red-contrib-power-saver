// Business logic functions for strategy-light-saver node
// These functions are exported for testing

/**
 * Parse a timestamp string as UTC, adding 'Z' suffix if missing
 * Home Assistant returns timestamps without 'Z', which causes them to be parsed as local time
 * @param {string} timestamp - ISO timestamp string
 * @returns {Date} - Date object parsed as UTC
 */
function parseUTCTimestamp(timestamp) {
  if (!timestamp) return null;
  // If timestamp doesn't end with 'Z', add it to force UTC parsing
  const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
  return new Date(utcTimestamp);
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
  
  node.log("State change event received: " + JSON.stringify(event).substring(0, 200));
  
  if (!event || !event.event) return;
  
  const entityId = event.event.entity_id;
  const newState = event.event.new_state;
  
  if (!entityId || !newState) {
    node.warn(`Event missing entity_id or new_state: ${JSON.stringify(event).substring(0, 100)}`);
    return;
  }
  
  node.log(`Processing state change for ${entityId}: ${newState.state}`);
  
  const timestamp = now.toISOString().substring(0, 19); // Format: yyyy-mm-ddTHH:MM:SS
  const timeOnly = now.toISOString().substring(11, 19); // Format: HH:MM:SS
  
  // Check if it's a trigger
  const trigger = config.triggers.find(t => t.entity_id === entityId);
  if (trigger) {
    trigger.lastChanged = timestamp;
    trigger.state = newState.state;
    
    node.log(`Updated trigger ${entityId}: state=${trigger.state}, lastChanged=${trigger.lastChanged}`);
    
    // If trigger turned on and timedOut is true, control the lights
    if (newState.state === 'on' && state.timedOut === true) {
      node.log(`Trigger ${entityId} turned on while timedOut=true, activating lights`);
      state.timedOut = false; // Reset timedOut after activating lights
      
      const level = findCurrentLevel(config, node, clock);
      if (level !== null) {
        controlLights(config.lights, level, node, homeAssistant);
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
    const oldState = config.nightSensor.state;
    config.nightSensor.lastChanged = timestamp;
    config.nightSensor.state = newState.state;
    
    node.log(`Updated night sensor ${entityId}: state=${config.nightSensor.state}, lastChanged=${config.nightSensor.lastChanged}`);
    
    node.status({ 
      fill: "green", 
      shape: "dot", 
      text: `Night: ${newState.state} - updated ${timeOnly}` 
    });
    
    // Return a signal that night sensor turned on (for turn off at night feature)
    if (oldState !== 'on' && newState.state === 'on') {
      return { nightSensorTurnedOn: true };
    }
    return;
  }
  
  node.warn(`Received state change for ${entityId} but not found in triggers or nightSensor`);
}

/**
 * Find the appropriate light level based on time and night sensor
 * @param {object} config - Configuration object with nightSensor, nightLevel, levels
 * @param {object} node - Node-RED node object for logging
 * @param {object} clock - Clock abstraction for getting current time (for testing)
 * @returns {number|null} The level (0-100) or null if no level found
 */
function findCurrentLevel(config, node, clock = null) {
  const now = clock ? clock.now() : new Date();
  
  // If night sensor is on and nightLevel is set, use that
  if (config.nightSensor && config.nightSensor.state === 'on' && 
      config.nightLevel !== null && config.nightLevel !== undefined) {
    node.log(`Using night level: ${config.nightLevel}%`);
    return config.nightLevel;
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
}

/**
 * Control lights by sending commands to Home Assistant
 * @param {array} lights - Array of light entities
 * @param {number} level - Level to set (0-100)
 * @param {object} node - Node-RED node object for logging
 * @param {object} homeAssistant - Home Assistant integration object
 */
function controlLights(lights, level, node, homeAssistant) {
  if (level === null || level === undefined) {
    node.warn('Cannot control lights: no valid level found');
    return;
  }
  
  node.log(`Controlling lights with level: ${level}%`);
  
  lights.forEach(light => {
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
}

/**
 * Turn off all lights
 * @param {array} lights - Array of light entities
 * @param {object} node - Node-RED node object for logging
 * @param {object} homeAssistant - Home Assistant integration object
 */
function turnOffAllLights(lights, node, homeAssistant) {
  node.log('Turning off all lights (timeout reached)');
  
  lights.forEach(light => {
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
    node.log('At least one trigger is on, no timeout check needed');
    return;
  }
  
  // All triggers are off, check if they've been off long enough
  node.log('All triggers are off, checking timeouts...');
  
  let allTimedOut = true;
  
  for (const trigger of config.triggers) {
    // Get timeout for this trigger (use specific timeout or fall back to lightTimeout)
    const timeoutMinutes = trigger.timeoutMinutes !== undefined ? trigger.timeoutMinutes : config.lightTimeout;
    
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
    const lastChangedTime = parseUTCTimestamp(trigger.lastChanged);
    const minutesOff = (now - lastChangedTime) / 1000 / 60;
    
    node.log(`Trigger ${trigger.entity_id}: off for ${minutesOff.toFixed(1)} minutes, timeout is ${timeoutMinutes} minutes`);
    
    if (minutesOff < timeoutMinutes) {
      allTimedOut = false;
      node.log(`Trigger ${trigger.entity_id} has not timed out yet`);
    }
  }
  
  if (allTimedOut && config.triggers.length > 0) {
    node.log('All triggers have timed out, turning off lights');
    turnOffAllLights(config.lights, node, homeAssistant);
    state.timedOut = true;
    node.status({ fill: "yellow", shape: "ring", text: "Timed out - lights off" });
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
  
  if (entitiesToFetch.length === 0) {
    node.log('All entities already have states');
  } else {
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
              const trigger = config.triggers.find(t => t.entity_id === entity.id);
              if (trigger) {
                trigger.state = stateObj.state;
                trigger.lastChanged = stateObj.last_changed || stateObj.last_updated;
                node.log(`Fetched state for trigger ${entity.id}: ${stateObj.state}`);
              }
            } else if (entity.type === 'nightSensor') {
              config.nightSensor.state = stateObj.state;
              config.nightSensor.lastChanged = stateObj.last_changed || stateObj.last_updated;
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
        node.log(`Trigger ${trigger.entity_id} is ON, not timed out`);
        break;
      }
      
      // If trigger is OFF, check how long it's been off
      if (trigger.state === 'off' && trigger.lastChanged) {
        const timeoutMinutes = trigger.timeoutMinutes !== undefined ? trigger.timeoutMinutes : config.lightTimeout;
        const lastChangedTime = parseUTCTimestamp(trigger.lastChanged);
        const minutesOff = (now - lastChangedTime) / 1000 / 60;
        
        if (minutesOff < timeoutMinutes) {
          allTimedOut = false;
          node.log(`Trigger ${trigger.entity_id} off for ${minutesOff.toFixed(1)} min, timeout is ${timeoutMinutes} min - NOT timed out yet`);
          break;
        } else {
          node.log(`Trigger ${trigger.entity_id} off for ${minutesOff.toFixed(1)} min, timeout is ${timeoutMinutes} min - timed out`);
        }
      } else if (!trigger.state) {
        // No state info, can't determine timeout - assume not timed out to be safe
        allTimedOut = false;
        node.log(`Trigger ${trigger.entity_id} has no state, assuming not timed out`);
        break;
      }
    }
    
    state.timedOut = allTimedOut;
    node.log(`Initial timedOut set to ${state.timedOut} (all triggers actually timed out: ${allTimedOut})`);
    return true; // Indicates that initial timedOut was set
  }
  
  return false;
}

module.exports = {
  parseUTCTimestamp,
  handleStateChange,
  findCurrentLevel,
  controlLights,
  turnOffAllLights,
  checkTimeouts,
  fetchMissingStates
};

# Node-RED Power Saver - Continuation Context

## Current State
- **Current Version:** 5.0.0-beta.7cg
- **Package Location:** `/Users/otto/dev/red-nodes/node-red-contrib-power-saver`
- **Working Directory:** `/Users/otto/dev/red-nodes/node-red-contrib-power-saver/src`
- **Latest Package:** node-red-contrib-power-saver-5.0.0-beta.7cg.tgz (43.0 kB)

## Version Numbering Pattern
- Use pattern: `5.0.0-beta.7c[letter]`
- Next version should be: `5.0.0-beta.7ch`
- Increment letter for each build (7ca → 7cb → 7cc → ... → 7cg → 7ch)

## Build Process
```bash
cd /Users/otto/dev/red-nodes/node-red-contrib-power-saver
# Update version in package.json
npm pack
```
Always show last 10 lines of npm pack output.

## Project Structure
```
src/
  strategy-light-saver.html         # UI config (43KB, 1070+ lines)
  strategy-light-saver.js           # Runtime logic (8KB, 400+ lines)
  strategy-light-saver-functions.js # Business logic (15KB, 500+ lines)
test/
  strategy-light-saver-functions.test.js  # 41 unit tests (all passing)
```

## Key Files & Architecture

### HTML File (strategy-light-saver.html)
- **Lines 1-22:** Node defaults (all config properties)
- **Lines 27-905:** `oneditprepare` function
  - Lines 86-189: `createEntitySelector()` - reusable entity dropdown helper
  - Lines 316-457: `renderNightSensor()` - night sensor UI with invert checkbox
  - Lines 459-544: `renderAwaySensor()` - away sensor UI (identical to night sensor)
  - Lines 546-605: `renderLevels()` - time-based levels with sliders
  - Lines 847-903: Override control initialization
- **Lines 905-977:** `oneditsave` function
- **Lines 979-1042:** HTML template with form rows
- **Lines 1044-1074:** Help text (markdown)

### JS File (strategy-light-saver.js)
- **Lines 12-26:** nodeConfig initialization
- **Lines 28-43:** Override mode initialization from config
- **Lines 110-159:** `handleStateChange()` wrapper - blocks if override active
- **Lines 161-169:** `checkTimeouts()` wrapper - blocks if override active
- **Lines 186-335:** Input message handler for config updates and override control
- **Lines 338-411:** Event subscriptions and initialization

### Functions File (strategy-light-saver-functions.js)
- **Exported functions:** parseUTCTimestamp, isNightMode, isAwayMode, handleStateChange, findCurrentLevel, controlLights, turnOffAllLights, checkTimeouts, fetchMissingStates
- **Key helper:** `parseUTCTimestamp()` - CRITICAL: adds 'Z' to HA timestamps (they're UTC but lack suffix)
- **Mode helpers:** `isNightMode()` and `isAwayMode()` handle invert logic

## Configuration Properties (nodeConfig)
```javascript
{
  triggers: [],              // Motion sensors with optional timeout
  lights: [],                // Lights to control
  lightTimeout: 10,          // Default timeout in minutes
  nightSensor: null,         // Binary sensor or input_boolean
  nightLevel: null,          // 0-100%
  nightDelay: 0,             // Seconds before applying night level
  invertNightSensor: false,  // Reverse logic (night when off)
  awaySensor: null,          // Binary sensor or input_boolean
  awayLevel: null,           // 0-100%
  awayDelay: 0,              // Seconds before applying away level
  invertAwaySensor: false,   // Reverse logic (away when off)
  levels: [],                // Time-based levels [{fromTime, level}]
  debugLog: false            // Enable debug logging
}
```

## Override Mode
- **Values:** 'auto', 'off', 'on', or number (0-100)
- **Default:** 'auto' (normal operation)
- **Config properties:** overrideEnabled (bool), overrideType ('off'|'on'|'level'), overrideLevel (0-100)
- **UI:** Checkbox + 3 radio buttons + slider/input on one row
- **Behavior:** When not 'auto', blocks state changes and timeout checking

## Input/Output API
**Input format:**
```json
{
  "commands": {
    "sendConfig": true
  },
  "config": {
    "lights": [...],
    "override": "auto"|"off"|"on"|0-100
  }
}
```
**Output format:**
- `oldConfig`: Sent before config update
- `newConfig`: Sent after config update
- `config`: Sent when sendConfig requested

## Critical Implementation Details

### Timezone Bug Fix
- **Problem:** HA timestamps like `2026-01-29T21:53:35` lack 'Z' suffix
- **Solution:** `parseUTCTimestamp()` adds 'Z' before parsing
- **Usage:** ALWAYS use this function when parsing HA timestamps for comparison

### Entity Selector Pattern
- Uses `createEntitySelector(initialValue, filterPrefix, useMousedown)`
- Returns `{wrapper, searchInput, select}`
- **filterPrefix:** comma-separated domains (e.g., 'binary_sensor,input_boolean')
- **useMousedown:** Use for away sensor (prevents blur issues)

### Level Priority
Night sensor > Away sensor > Time-based levels

### Slider/Input Synchronization
- All level inputs have synchronized slider + number input
- CSS hides spinner arrows: `#night-level-input`, `#node-input-awayLevel`, `#node-input-overrideLevel`, `.level-input`

### Form Order (Top to Bottom)
1. Name
2. Server
3. Lights
4. Keep light on for (lightTimeout)
5. Triggers
6. Night sensor (with Invert, Night level, Delay)
7. Away sensor (with Invert, Away level, Delay)
8. Light levels (time-based)
9. Override (checkbox + radio buttons + slider/input)
10. Debug log

## Important Quirks
1. **No null checks needed** - Override mode never uses null, only 'auto'
2. **Away sensor replaced Enable sensor** - Old logic removed, new is like night sensor
3. **Override on startup** - Applied 8 seconds after start (6s HA connection + 2s state load)
4. **Package size** - Keep under 50 kB (currently 43 kB)
5. **.npmignore critical** - Must exclude `*.tgz` to prevent size explosion

## Testing
- 41 unit tests in `test/strategy-light-saver-functions.test.js`
- Run: `npm test`
- All tests passing as of 7cg

## Deployment
User manually uploads .tgz to Node-RED on Home Assistant (10.0.0.25)

## User Preferences
- Be concise, make changes without extensive explanation
- Build after each change
- Fix bugs immediately when found
- Remove unused code/variables
- Keep code clean and minimal

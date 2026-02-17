const expect = require("chai").expect;
const sinon = require("sinon");
const funcs = require("../src/light-saver-functions");

describe("light-saver-functions", function () {
  let mockNode;
  let mockHomeAssistant;
  let mockWebsocket;
  let mockClock;

  beforeEach(function () {
    // Create mock node
    mockNode = {
      log: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      status: sinon.stub()
    };

    // Create mock Home Assistant
    mockWebsocket = {
      send: sinon.stub(),
      states: {}
    };

    mockHomeAssistant = {
      websocket: mockWebsocket
    };

    // Create mock clock
    mockClock = {
      now: () => new Date('2026-01-29T15:30:00Z')
    };
  });

  describe("parseUTCTimestamp", function () {
    it("should add Z suffix if missing", function () {
      const result = funcs.parseUTCTimestamp('2026-01-29T21:53:35');
      expect(result.toISOString()).to.equal('2026-01-29T21:53:35.000Z');
    });

    it("should not add Z suffix if already present", function () {
      const result = funcs.parseUTCTimestamp('2026-01-29T21:53:35Z');
      expect(result.toISOString()).to.equal('2026-01-29T21:53:35.000Z');
    });

    it("should return null for null input", function () {
      const result = funcs.parseUTCTimestamp(null);
      expect(result).to.be.null;
    });

    it("should return null for undefined input", function () {
      const result = funcs.parseUTCTimestamp(undefined);
      expect(result).to.be.null;
    });

    it("should handle timestamp with +00:00 offset", function () {
      const result = funcs.parseUTCTimestamp('2026-01-29T21:53:35+00:00');
      expect(result.toISOString()).to.equal('2026-01-29T21:53:35.000Z');
    });

    it("should handle timestamp with positive offset", function () {
      const result = funcs.parseUTCTimestamp('2026-01-29T21:53:35+05:30');
      // +05:30 means 5.5 hours ahead, so UTC should be 5.5 hours earlier
      expect(result.toISOString()).to.equal('2026-01-29T16:23:35.000Z');
    });

    it("should handle timestamp with negative offset", function () {
      const result = funcs.parseUTCTimestamp('2026-01-29T21:53:35-05:00');
      // -05:00 means 5 hours behind, so UTC should be 5 hours later
      expect(result.toISOString()).to.equal('2026-01-30T02:53:35.000Z');
    });
  });

  describe("extractBrightnessLevel", function () {
    it("should return 0 for off state", function () {
      const stateObj = { state: 'off' };
      const result = funcs.extractBrightnessLevel(stateObj);
      expect(result).to.equal(0);
    });

    it("should return 100 for on state without brightness", function () {
      const stateObj = { state: 'on', attributes: {} };
      const result = funcs.extractBrightnessLevel(stateObj);
      expect(result).to.equal(100);
    });

    it("should convert brightness from 0-255 to 0-100", function () {
      const stateObj = { state: 'on', attributes: { brightness: 128 } };
      const result = funcs.extractBrightnessLevel(stateObj);
      expect(result).to.equal(50);
    });

    it("should handle brightness 255 as 100%", function () {
      const stateObj = { state: 'on', attributes: { brightness: 255 } };
      const result = funcs.extractBrightnessLevel(stateObj);
      expect(result).to.equal(100);
    });

    it("should handle brightness 0 as 0%", function () {
      const stateObj = { state: 'on', attributes: { brightness: 0 } };
      const result = funcs.extractBrightnessLevel(stateObj);
      expect(result).to.equal(0);
    });

    it("should return null for null input", function () {
      const result = funcs.extractBrightnessLevel(null);
      expect(result).to.be.null;
    });

    it("should return null for unknown state", function () {
      const stateObj = { state: 'unavailable' };
      const result = funcs.extractBrightnessLevel(stateObj);
      expect(result).to.be.null;
    });
  });

  describe("isSensorActive", function () {
    it("should return false if sensor is null", function () {
      const result = funcs.isSensorActive(null, false);
      expect(result).to.be.false;
    });

    it("should return false if sensor has no state", function () {
      const result = funcs.isSensorActive({}, false);
      expect(result).to.be.false;
    });

    it("should return true when sensor is 'on' and not inverted", function () {
      const sensor = { state: 'on' };
      const result = funcs.isSensorActive(sensor, false);
      expect(result).to.be.true;
    });

    it("should return false when sensor is 'off' and not inverted", function () {
      const sensor = { state: 'off' };
      const result = funcs.isSensorActive(sensor, false);
      expect(result).to.be.false;
    });

    it("should return false when sensor is 'on' and inverted", function () {
      const sensor = { state: 'on' };
      const result = funcs.isSensorActive(sensor, true);
      expect(result).to.be.false;
    });

    it("should return true when sensor is 'off' and inverted", function () {
      const sensor = { state: 'off' };
      const result = funcs.isSensorActive(sensor, true);
      expect(result).to.be.true;
    });

    it("should handle boolean true state", function () {
      const sensor = { state: true };
      const result = funcs.isSensorActive(sensor, false);
      expect(result).to.be.true;
    });

    it("should handle string 'true' state", function () {
      const sensor = { state: 'true' };
      const result = funcs.isSensorActive(sensor, false);
      expect(result).to.be.true;
    });

    it("should handle boolean false state without invert", function () {
      const sensor = { state: false };
      const result = funcs.isSensorActive(sensor, false);
      expect(result).to.be.false;
    });

    it("should handle boolean false state with invert", function () {
      const sensor = { state: false };
      const result = funcs.isSensorActive(sensor, true);
      expect(result).to.be.true;
    });

    it("should handle string 'false' state without invert", function () {
      const sensor = { state: 'false' };
      const result = funcs.isSensorActive(sensor, false);
      expect(result).to.be.false;
    });

    it("should handle string 'false' state with invert", function () {
      const sensor = { state: 'false' };
      const result = funcs.isSensorActive(sensor, true);
      expect(result).to.be.true;
    });
  });

  describe("findCurrentLevel", function () {
    it("should return night level when night sensor is on", function () {
      const config = {
        nightSensor: { 
          state: 'on', 
          entity_id: 'binary_sensor.night',
          level: 25
        },
        levels: [{ fromTime: "00:00", level: 100 }]
      };

      const level = funcs.findCurrentLevel(config, mockNode, mockClock);

      expect(level).to.equal(25);
      expect(mockNode.log.calledWith('Using night level: 25%')).to.be.true;
    });

    it("should fall through to time-based level when nightLevel is not set", function () {
      const config = {
        nightSensor: { 
          state: 'on', 
          entity_id: 'binary_sensor.night',
          level: null
        },
        levels: [{ fromTime: "00:00", level: 100 }]
      };

      const level = funcs.findCurrentLevel(config, mockNode, mockClock);

      // Should fall through to time-based logic when nightLevel is null
      expect(level).to.equal(100);
    });

    it("should return time-based level when night sensor is off", function () {
      const config = {
        nightSensor: { 
          state: 'off', 
          entity_id: 'binary_sensor.night',
          level: 25
        },
        levels: [
          { fromTime: "00:00", level: 20 },
          { fromTime: "06:00", level: 100 },
          { fromTime: "14:00", level: 75 }, // This should be selected (15:30 is after 14:00)
          { fromTime: "22:00", level: 50 }
        ]
      };

      // Clock is set to 15:30
      const level = funcs.findCurrentLevel(config, mockNode, mockClock);

      expect(level).to.equal(75);
    });

    it("should wrap to previous day if current time is before all levels", function () {
      const config = {
        nightSensor: null,
        levels: [
          { fromTime: "06:00", level: 100 },
          { fromTime: "22:00", level: 50 }
        ]
      };

      // Set clock to 03:00 (before all levels)
      const earlyClock = {
        now: () => new Date('2026-01-29T03:00:00Z')
      };

      const level = funcs.findCurrentLevel(config, mockNode, earlyClock);

      // Should use last level from previous day
      expect(level).to.equal(50);
    });

    it("should return null if no levels are defined", function () {
      const config = {
        nightSensor: null,
        levels: []
      };

      const level = funcs.findCurrentLevel(config, mockNode, mockClock);

      expect(level).to.be.null;
      expect(mockNode.warn.calledWith('No levels defined')).to.be.true;
    });

    it("should handle midnight correctly", function () {
      const config = {
        nightSensor: null,
        levels: [
          { fromTime: "00:00", level: 20 },
          { fromTime: "06:00", level: 100 }
        ]
      };

      const midnightClock = {
        now: () => new Date('2026-01-29T00:00:00Z')
      };

      const level = funcs.findCurrentLevel(config, mockNode, midnightClock);

      expect(level).to.equal(20);
    });
  });

  describe("controlLights", function () {
    it("should turn on lights with brightness percentage", function () {
      const lights = [
        { entity_id: 'light.living_room' },
        { entity_id: 'light.bedroom' }
      ];

      funcs.controlLights(lights, 75, mockNode, mockHomeAssistant);

      expect(mockWebsocket.send.callCount).to.equal(2);
      
      const firstCall = mockWebsocket.send.getCall(0).args[0];
      expect(firstCall.domain).to.equal('light');
      expect(firstCall.service).to.equal('turn_on');
      expect(firstCall.service_data.entity_id).to.equal('light.living_room');
      expect(firstCall.service_data.brightness_pct).to.equal(75);
    });

    it("should turn off lights when level is 0", function () {
      const lights = [{ entity_id: 'light.living_room' }];

      funcs.controlLights(lights, 0, mockNode, mockHomeAssistant);

      const call = mockWebsocket.send.getCall(0).args[0];
      expect(call.service).to.equal('turn_off');
      expect(call.service_data).to.not.have.property('brightness_pct');
    });

    it("should turn on switches without brightness", function () {
      const lights = [{ entity_id: 'switch.outlet' }];

      funcs.controlLights(lights, 75, mockNode, mockHomeAssistant);

      const call = mockWebsocket.send.getCall(0).args[0];
      expect(call.domain).to.equal('switch');
      expect(call.service).to.equal('turn_on');
      expect(call.service_data).to.not.have.property('brightness_pct');
    });

    it("should turn off switches when level is 0", function () {
      const lights = [{ entity_id: 'switch.outlet' }];

      funcs.controlLights(lights, 0, mockNode, mockHomeAssistant);

      const call = mockWebsocket.send.getCall(0).args[0];
      expect(call.domain).to.equal('switch');
      expect(call.service).to.equal('turn_off');
    });

    it("should warn if level is null", function () {
      const lights = [{ entity_id: 'light.living_room' }];

      funcs.controlLights(lights, null, mockNode, mockHomeAssistant);

      expect(mockWebsocket.send.called).to.be.false;
      expect(mockNode.warn.calledWith('Cannot control lights: no valid level found')).to.be.true;
    });
  });

  describe("turnOffAllLights", function () {
    it("should turn off all lights", function () {
      const lights = [
        { entity_id: 'light.living_room' },
        { entity_id: 'switch.outlet' },
        { entity_id: 'light.bedroom' }
      ];

      funcs.turnOffAllLights(lights, mockNode, mockHomeAssistant);

      expect(mockWebsocket.send.callCount).to.equal(3);
      
      mockWebsocket.send.getCalls().forEach(call => {
        const args = call.args[0];
        expect(args.service).to.equal('turn_off');
      });
    });

    it("should handle empty lights array", function () {
      funcs.turnOffAllLights([], mockNode, mockHomeAssistant);

      expect(mockWebsocket.send.called).to.be.false;
    });
  });

  describe("checkTimeouts", function () {
    it("should not timeout if any trigger is on", function () {
      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1', state: 'on', lastChanged: '2026-01-29T15:20:00Z' },
          { entity_id: 'binary_sensor.motion2', state: 'off', lastChanged: '2026-01-29T15:00:00Z' }
        ],
        lights: [{ entity_id: 'light.living_room' }],
        lightTimeout: 10
      };
      const state = { timedOut: false };

      funcs.checkTimeouts(config, state, mockNode, mockHomeAssistant, mockClock);

      expect(mockWebsocket.send.called).to.be.false;
      expect(state.timedOut).to.be.false;
      expect(mockNode.log.calledWith('At least one trigger is on, no timeout check needed')).to.be.true;
    });

    it("should timeout if all triggers have been off longer than timeout", function () {
      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1', state: 'off', lastChanged: '2026-01-29T15:00:00Z' }, // 30 minutes ago
          { entity_id: 'binary_sensor.motion2', state: 'off', lastChanged: '2026-01-29T15:10:00Z' }  // 20 minutes ago
        ],
        lights: [{ entity_id: 'light.living_room' }],
        lightTimeout: 10 // 10 minutes
      };
      const state = { timedOut: false };

      funcs.checkTimeouts(config, state, mockNode, mockHomeAssistant, mockClock);

      expect(state.timedOut).to.be.true;
      expect(mockWebsocket.send.called).to.be.true;
      expect(mockNode.status.calledWith({ fill: "yellow", shape: "ring", text: "Timed out - lights off" })).to.be.true;
    });

    it("should not timeout if one trigger hasn't reached timeout yet", function () {
      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1', state: 'off', lastChanged: '2026-01-29T15:00:00Z' }, // 30 minutes ago (timed out)
          { entity_id: 'binary_sensor.motion2', state: 'off', lastChanged: '2026-01-29T15:25:00Z' }  // 5 minutes ago (NOT timed out)
        ],
        lights: [{ entity_id: 'light.living_room' }],
        lightTimeout: 10 // 10 minutes
      };
      const state = { timedOut: false };

      funcs.checkTimeouts(config, state, mockNode, mockHomeAssistant, mockClock);

      expect(state.timedOut).to.be.false; // Should NOT timeout because motion2 hasn't timed out yet
      expect(mockWebsocket.send.called).to.be.false;
    });

    it("should use trigger-specific timeout if set", function () {
      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1', state: 'off', lastChanged: '2026-01-29T15:00:00Z', timeoutMinutes: 5 }, // 30 min ago, 5 min timeout = timed out
          { entity_id: 'binary_sensor.motion2', state: 'off', lastChanged: '2026-01-29T15:15:00Z', timeoutMinutes: 20 } // 15 min ago, 20 min timeout = NOT timed out yet
        ],
        lights: [{ entity_id: 'light.living_room' }],
        lightTimeout: 10
      };
      const state = { timedOut: false };

      funcs.checkTimeouts(config, state, mockNode, mockHomeAssistant, mockClock);

      // motion2 hasn't timed out yet (20 min timeout, only 15 min have passed)
      expect(state.timedOut).to.be.false; // Should NOT timeout
      expect(mockWebsocket.send.called).to.be.false;
    });

    it("should skip triggers without state or lastChanged", function () {
      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1' }, // No state
          { entity_id: 'binary_sensor.motion2', state: 'off', lastChanged: '2026-01-29T15:00:00Z' }
        ],
        lights: [{ entity_id: 'light.living_room' }],
        lightTimeout: 10
      };
      const state = { timedOut: false };

      funcs.checkTimeouts(config, state, mockNode, mockHomeAssistant, mockClock);

      expect(state.timedOut).to.be.false;
      expect(mockNode.log.calledWith('Trigger binary_sensor.motion1 has no state/lastChanged, skipping')).to.be.true;
    });
  });

  describe("fetchMissingStates", function () {
    it("should fetch states for triggers without state", function () {
      mockWebsocket.states = {
        'binary_sensor.motion1': { state: 'off', last_changed: '2026-01-29T15:00:00Z' },
        'binary_sensor.motion2': { state: 'on', last_changed: '2026-01-29T15:20:00Z' }
      };

      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1' }, // No state
          { entity_id: 'binary_sensor.motion2' }  // No state
        ],
        nightSensor: null
      };
      const state = { timedOut: undefined };

      funcs.fetchMissingStates(config, state, mockNode, mockHomeAssistant);

      expect(config.triggers[0].state).to.equal('off');
      expect(config.triggers[0].lastChanged).to.equal('2026-01-29T15:00:00Z');
      expect(config.triggers[1].state).to.equal('on');
      expect(config.triggers[1].lastChanged).to.equal('2026-01-29T15:20:00Z');
    });

    it("should set initial timedOut to true if all triggers have actually timed out", function () {
      // Set clock to 15:30
      const testClock = {
        now: () => new Date('2026-01-29T15:30:00Z')
      };
      
      mockWebsocket.states = {
        'binary_sensor.motion1': { state: 'off', last_changed: '2026-01-29T15:00:00Z' }, // 30 min ago
        'binary_sensor.motion2': { state: 'off', last_changed: '2026-01-29T15:10:00Z' }  // 20 min ago
      };

      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1' },
          { entity_id: 'binary_sensor.motion2' }
        ],
        lightTimeout: 10, // 10 minute timeout
        nightSensor: null
      };
      const state = { timedOut: undefined };

      const result = funcs.fetchMissingStates(config, state, mockNode, mockHomeAssistant, testClock);

      expect(state.timedOut).to.be.true; // Both have been off > 10 minutes
      expect(result).to.be.true; // Returns true when initial timedOut was set
    });

    it("should set initial timedOut to false if any trigger is on", function () {
      mockWebsocket.states = {
        'binary_sensor.motion1': { state: 'off', last_changed: '2026-01-29T15:00:00Z' },
        'binary_sensor.motion2': { state: 'on', last_changed: '2026-01-29T15:20:00Z' }
      };

      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1' },
          { entity_id: 'binary_sensor.motion2' }
        ],
        nightSensor: null
      };
      const state = { timedOut: undefined };

      funcs.fetchMissingStates(config, state, mockNode, mockHomeAssistant);

      expect(state.timedOut).to.be.false;
    });

    it("should set initial timedOut to false if triggers are off but within timeout period", function () {
      // Set clock to 15:30
      const testClock = {
        now: () => new Date('2026-01-29T15:30:00Z')
      };
      
      mockWebsocket.states = {
        'binary_sensor.motion1': { state: 'off', last_changed: '2026-01-29T15:25:00Z' }, // 5 min ago
        'binary_sensor.motion2': { state: 'off', last_changed: '2026-01-29T15:27:00Z' }  // 3 min ago
      };

      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1' },
          { entity_id: 'binary_sensor.motion2' }
        ],
        lightTimeout: 10, // 10 minute timeout
        nightSensor: null
      };
      const state = { timedOut: undefined };

      const result = funcs.fetchMissingStates(config, state, mockNode, mockHomeAssistant, testClock);

      expect(state.timedOut).to.be.false; // Not timed out yet (< 10 minutes)
      expect(result).to.be.true;
    });

    it("should fetch night sensor state", function () {
      mockWebsocket.states = {
        'binary_sensor.night': { state: 'on', last_changed: '2026-01-29T20:00:00Z' }
      };

      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1', state: 'off' } // Already has state
        ],
        nightSensor: { entity_id: 'binary_sensor.night' } // No state
      };
      const state = { timedOut: undefined };

      funcs.fetchMissingStates(config, state, mockNode, mockHomeAssistant);

      expect(config.nightSensor.state).to.equal('on');
      expect(config.nightSensor.lastChanged).to.equal('2026-01-29T20:00:00Z');
    });

    it("should not set initial timedOut if already set", function () {
      mockWebsocket.states = {
        'binary_sensor.motion1': { state: 'off', last_changed: '2026-01-29T15:00:00Z' }
      };

      const config = {
        triggers: [{ entity_id: 'binary_sensor.motion1' }],
        nightSensor: null
      };
      const state = { timedOut: true }; // Already set

      const result = funcs.fetchMissingStates(config, state, mockNode, mockHomeAssistant);

      expect(state.timedOut).to.be.true; // Should remain unchanged
      expect(result).to.be.false; // Returns false when initial timedOut was not set
    });

    it("should handle missing states gracefully", function () {
      mockWebsocket.states = {}; // No states available

      const config = {
        triggers: [{ entity_id: 'binary_sensor.motion1' }],
        nightSensor: null
      };
      const state = { timedOut: undefined };

      funcs.fetchMissingStates(config, state, mockNode, mockHomeAssistant);

      expect(config.triggers[0].state).to.be.undefined;
      expect(mockNode.warn.calledWith('State not found for binary_sensor.motion1')).to.be.true;
    });
  });

  describe("handleStateChange", function () {
    it("should update trigger state", function () {
      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1', state: 'off', lastChanged: '2026-01-29T15:00:00Z' }
        ],
        lights: [{ entity_id: 'light.living_room' }],
        nightSensor: null,
        levels: [{ fromTime: "00:00", level: 100 }]
      };
      const state = { timedOut: false };

      const event = {
        event: {
          entity_id: 'binary_sensor.motion1',
          new_state: {
            state: 'on',
            entity_id: 'binary_sensor.motion1'
          }
        }
      };

      funcs.handleStateChange(event, config, state, mockNode, mockHomeAssistant, mockClock);

      expect(config.triggers[0].state).to.equal('on');
      expect(state.timedOut).to.be.false;
      expect(mockNode.status.called).to.be.true;
    });

    it("should activate lights when trigger turns on while timedOut", function () {
      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1', state: 'off', lastChanged: '2026-01-29T15:00:00Z' }
        ],
        lights: [{ entity_id: 'light.living_room' }],
        nightSensor: null,
        levels: [{ fromTime: "00:00", level: 80 }]
      };
      const state = { timedOut: true };

      const event = {
        event: {
          entity_id: 'binary_sensor.motion1',
          new_state: {
            state: 'on',
            entity_id: 'binary_sensor.motion1'
          }
        }
      };

      funcs.handleStateChange(event, config, state, mockNode, mockHomeAssistant, mockClock);

      expect(state.timedOut).to.be.false;
      expect(mockWebsocket.send.called).to.be.true;
      
      const call = mockWebsocket.send.getCall(0).args[0];
      expect(call.service).to.equal('turn_on');
      expect(call.service_data.brightness_pct).to.equal(80);
    });

    it("should not activate lights when trigger turns on if not timedOut", function () {
      const config = {
        triggers: [
          { entity_id: 'binary_sensor.motion1', state: 'off', lastChanged: '2026-01-29T15:00:00Z' }
        ],
        lights: [{ entity_id: 'light.living_room' }],
        nightSensor: null,
        levels: [{ fromTime: "00:00", level: 80 }]
      };
      const state = { timedOut: false };

      const event = {
        event: {
          entity_id: 'binary_sensor.motion1',
          new_state: {
            state: 'on',
            entity_id: 'binary_sensor.motion1'
          }
        }
      };

      funcs.handleStateChange(event, config, state, mockNode, mockHomeAssistant, mockClock);

      expect(state.timedOut).to.be.false;
      expect(mockWebsocket.send.called).to.be.false;
    });

    it("should update night sensor state", function () {
      const config = {
        triggers: [{ entity_id: 'binary_sensor.motion1', state: 'off' }],
        lights: [],
        nightSensor: { 
          entity_id: 'binary_sensor.night', 
          state: 'off', 
          lastChanged: '2026-01-29T15:00:00Z',
          level: 25
        },
        levels: []
      };
      const state = { timedOut: false };

      const event = {
        event: {
          entity_id: 'binary_sensor.night',
          new_state: {
            state: 'on',
            entity_id: 'binary_sensor.night'
          }
        }
      };

      funcs.handleStateChange(event, config, state, mockNode, mockHomeAssistant, mockClock);

      expect(config.nightSensor.state).to.equal('on');
      expect(mockNode.status.called).to.be.true;
    });

    it("should handle invalid events gracefully", function () {
      const config = {
        triggers: [{ entity_id: 'binary_sensor.motion1' }],
        lights: [],
        nightSensor: null,
        levels: []
      };
      const state = { timedOut: false };

      funcs.handleStateChange(null, config, state, mockNode, mockHomeAssistant, mockClock);
      funcs.handleStateChange({}, config, state, mockNode, mockHomeAssistant, mockClock);
      funcs.handleStateChange({ event: {} }, config, state, mockNode, mockHomeAssistant, mockClock);

      expect(mockNode.warn.called).to.be.true;
    });

    it("should use night level when night sensor is on", function () {
      const config = {
        triggers: [{ entity_id: 'binary_sensor.motion1', state: 'off' }],
        lights: [{ entity_id: 'light.living_room' }],
        nightSensor: { 
          entity_id: 'binary_sensor.night', 
          state: 'on',
          level: 30
        },
        levels: [{ fromTime: "00:00", level: 100 }]
      };
      const state = { timedOut: true };

      const event = {
        event: {
          entity_id: 'binary_sensor.motion1',
          new_state: {
            state: 'on',
            entity_id: 'binary_sensor.motion1'
          }
        }
      };

      funcs.handleStateChange(event, config, state, mockNode, mockHomeAssistant, mockClock);

      const call = mockWebsocket.send.getCall(0).args[0];
      expect(call.service_data.brightness_pct).to.equal(30);
    });
  });

  describe("isNightMode", function () {
    it("should return true when night sensor is on and not inverted", function () {
      const config = {
        nightSensor: { 
          state: 'on', 
          entity_id: 'binary_sensor.night',
          invert: false
        }
      };

      const result = funcs.isNightMode(config);
      expect(result).to.be.true;
    });

    it("should return false when night sensor is off and not inverted", function () {
      const config = {
        nightSensor: { 
          state: 'off', 
          entity_id: 'binary_sensor.night',
          invert: false
        }
      };

      const result = funcs.isNightMode(config);
      expect(result).to.be.false;
    });

    it("should return false when night sensor is on and inverted", function () {
      const config = {
        nightSensor: { 
          state: 'on', 
          entity_id: 'binary_sensor.night',
          invert: true
        }
      };

      const result = funcs.isNightMode(config);
      expect(result).to.be.false;
    });

    it("should return true when night sensor is off and inverted", function () {
      const config = {
        nightSensor: { 
          state: 'off', 
          entity_id: 'binary_sensor.night',
          invert: true
        }
      };

      const result = funcs.isNightMode(config);
      expect(result).to.be.true;
    });

    it("should return false when night sensor is not configured", function () {
      const config = {
        nightSensor: null
      };

      const result = funcs.isNightMode(config);
      expect(result).to.be.false;
    });

    it("should return false when night sensor has no state", function () {
      const config = {
        nightSensor: { 
          entity_id: 'binary_sensor.night',
          invert: false
        }
      };

      const result = funcs.isNightMode(config);
      expect(result).to.be.false;
    });
  });

  describe("isAwayMode", function () {
    it("should return true when away sensor is on and not inverted", function () {
      const config = {
        awaySensor: { 
          state: 'on', 
          entity_id: 'binary_sensor.away',
          invert: false
        }
      };

      const result = funcs.isAwayMode(config);
      expect(result).to.be.true;
    });

    it("should return false when away sensor is off and not inverted", function () {
      const config = {
        awaySensor: { 
          state: 'off', 
          entity_id: 'binary_sensor.away',
          invert: false
        }
      };

      const result = funcs.isAwayMode(config);
      expect(result).to.be.false;
    });

    it("should return false when away sensor is on and inverted", function () {
      const config = {
        awaySensor: { 
          state: 'on', 
          entity_id: 'binary_sensor.away',
          invert: true
        }
      };

      const result = funcs.isAwayMode(config);
      expect(result).to.be.false;
    });

    it("should return true when away sensor is off and inverted", function () {
      const config = {
        awaySensor: { 
          state: 'off', 
          entity_id: 'binary_sensor.away',
          invert: true
        }
      };

      const result = funcs.isAwayMode(config);
      expect(result).to.be.true;
    });

    it("should return false when away sensor is not configured", function () {
      const config = {
        awaySensor: null
      };

      const result = funcs.isAwayMode(config);
      expect(result).to.be.false;
    });

    it("should return false when away sensor has no state", function () {
      const config = {
        awaySensor: { 
          entity_id: 'binary_sensor.away',
          invert: false
        }
      };

      const result = funcs.isAwayMode(config);
      expect(result).to.be.false;
    });
  });

  describe("isBrightnessAllowingLights", function () {
    it("should return true when no brightness sensor configured", function () {
      const config = {
        brightnessSensor: null
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.true;
    });

    it("should return true when brightness sensor has no limit", function () {
      const config = {
        brightnessSensor: { 
          entity_id: 'sensor.brightness',
          state: '100',
          limit: null,
          mode: 'max'
        }
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.true;
    });

    it("should return true when brightness sensor has no state yet", function () {
      const config = {
        brightnessSensor: { 
          entity_id: 'sensor.brightness',
          state: null,
          limit: 50,
          mode: 'max'
        }
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.true;
    });

    it("should return true in max mode when brightness is below limit", function () {
      const config = {
        brightnessSensor: { 
          entity_id: 'sensor.brightness',
          state: '30',
          limit: 50,
          mode: 'max'
        }
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.true;
    });

    it("should return false in max mode when brightness is above limit", function () {
      const config = {
        brightnessSensor: { 
          entity_id: 'sensor.brightness',
          state: '70',
          limit: 50,
          mode: 'max'
        }
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.false;
    });

    it("should return true in min mode when brightness is above limit", function () {
      const config = {
        brightnessSensor: { 
          entity_id: 'sensor.brightness',
          state: '70',
          limit: 50,
          mode: 'min'
        }
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.true;
    });

    it("should return false in min mode when brightness is below limit", function () {
      const config = {
        brightnessSensor: { 
          entity_id: 'sensor.brightness',
          state: '30',
          limit: 50,
          mode: 'min'
        }
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.false;
    });

    it("should handle brightness at exactly the limit in max mode", function () {
      const config = {
        brightnessSensor: { 
          entity_id: 'sensor.brightness',
          state: '50',
          limit: 50,
          mode: 'max'
        }
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.false; // Equal is not less than
    });

    it("should handle brightness at exactly the limit in min mode", function () {
      const config = {
        brightnessSensor: { 
          entity_id: 'sensor.brightness',
          state: '50',
          limit: 50,
          mode: 'min'
        }
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.false; // Equal is not greater than
    });

    it("should default to max mode when mode not specified", function () {
      const config = {
        brightnessSensor: { 
          entity_id: 'sensor.brightness',
          state: '30',
          limit: 50
          // mode not specified
        }
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.true; // 30 < 50, so allowed in max mode
    });

    it("should return true for invalid brightness value", function () {
      const config = {
        brightnessSensor: { 
          entity_id: 'sensor.brightness',
          state: 'invalid',
          limit: 50,
          mode: 'max'
        }
      };

      const result = funcs.isBrightnessAllowingLights(config);
      expect(result).to.be.true; // Fail-open
    });
  });

  describe("findCurrentLevel with away mode", function () {
    it("should return away level when away sensor is on", function () {
      const config = {
        awaySensor: { 
          state: 'on', 
          entity_id: 'binary_sensor.away',
          level: 10,
          invert: false
        },
        nightSensor: { 
          state: 'off', 
          entity_id: 'binary_sensor.night',
          level: 25,
          invert: false
        },
        levels: [{ fromTime: "00:00", level: 100 }]
      };

      const level = funcs.findCurrentLevel(config, mockNode, mockClock);

      expect(level).to.equal(10);
      expect(mockNode.log.calledWith('Using away level: 10%')).to.be.true;
    });

    it("should prioritize away level over night level", function () {
      const config = {
        awaySensor: { 
          state: 'on', 
          entity_id: 'binary_sensor.away',
          level: 10,
          invert: false
        },
        nightSensor: { 
          state: 'on', 
          entity_id: 'binary_sensor.night',
          level: 25,
          invert: false
        },
        levels: [{ fromTime: "00:00", level: 100 }]
      };

      const level = funcs.findCurrentLevel(config, mockNode, mockClock);

      expect(level).to.equal(10);
      expect(mockNode.log.calledWith('Using away level: 10%')).to.be.true;
    });

    it("should fall through to time-based level when awayLevel is not set", function () {
      const config = {
        awaySensor: { 
          state: 'on', 
          entity_id: 'binary_sensor.away',
          level: null,
          invert: false
        },
        levels: [{ fromTime: "00:00", level: 100 }]
      };

      const level = funcs.findCurrentLevel(config, mockNode, mockClock);

      expect(level).to.equal(100);
    });

    it("should use away level with inverted sensor", function () {
      const config = {
        awaySensor: { 
          state: 'off', 
          entity_id: 'binary_sensor.away',
          level: 5,
          invert: true
        },
        levels: [{ fromTime: "00:00", level: 100 }]
      };

      const level = funcs.findCurrentLevel(config, mockNode, mockClock);

      expect(level).to.equal(5);
      expect(mockNode.log.calledWith('Using away level: 5%')).to.be.true;
    });
  });

  describe("findLevelConfig", function () {
    it("should return null if no levels defined", function () {
      const config = {
        levels: []
      };

      const levelConfig = funcs.findLevelConfig(config, mockClock);

      expect(levelConfig).to.be.null;
    });

    it("should return the level config for current time", function () {
      const config = {
        levels: [
          { fromTime: "05:00", level: 100, immediate: false },
          { fromTime: "12:00", level: 80, immediate: true }
        ]
      };

      const levelConfig = funcs.findLevelConfig(config, mockClock);

      // Clock is 15:30, so should match 12:00 level
      expect(levelConfig).to.deep.equal({ fromTime: "12:00", level: 80, immediate: true });
    });

    it("should return the latest level that started before current time", function () {
      const config = {
        levels: [
          { fromTime: "05:00", level: 100, immediate: false },
          { fromTime: "12:00", level: 80, immediate: false },
          { fromTime: "18:00", level: 50, immediate: true }
        ]
      };

      const levelConfig = funcs.findLevelConfig(config, mockClock);

      // Clock is 15:30, so latest before current time is 12:00
      expect(levelConfig).to.deep.equal({ fromTime: "12:00", level: 80, immediate: false });
    });

    it("should handle undefined immediate flag", function () {
      const config = {
        levels: [
          { fromTime: "12:00", level: 75 }
        ]
      };

      const levelConfig = funcs.findLevelConfig(config, mockClock);

      expect(levelConfig).to.deep.equal({ fromTime: "12:00", level: 75 });
    });

    it("should work with custom clock", function () {
      const customClock = {
        now: () => new Date('2026-01-29T19:00:00Z')
      };

      const config = {
        levels: [
          { fromTime: "18:00", level: 50, immediate: true }
        ]
      };

      const levelConfig = funcs.findLevelConfig(config, customClock);

      expect(levelConfig).to.deep.equal({ fromTime: "18:00", level: 50, immediate: true });
    });
  });
});

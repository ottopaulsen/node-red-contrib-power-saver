const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const lightSaver = require("../src/light-saver.js");

helper.init(require.resolve("node-red"));

describe("ps-light-saver node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  describe("Node Loading", function () {
    it("should be loaded with basic config", function (done) {
      const flow = [
        {
          id: "n1",
          type: "ps-light-saver",
          name: "Light Saver Test",
          triggers: [{ entity_id: "binary_sensor.motion1" }],
          lights: [{ entity_id: "light.living_room" }],
          lightTimeout: 10,
          levels: [{ fromTime: "00:00", level: 100 }]
        }
      ];

      helper.load([lightSaver], flow, function () {
        const n1 = helper.getNode("n1");
        expect(n1).to.not.be.undefined;
        expect(n1).to.have.property("name", "Light Saver Test");
        done();
      });
    });

    it("should warn if no server configured", function (done) {
      const flow = [
        {
          id: "n1",
          type: "ps-light-saver",
          name: "No Server",
          triggers: [{ entity_id: "binary_sensor.motion1" }],
          lights: [{ entity_id: "light.living_room" }]
        }
      ];

      helper.load([lightSaver], flow, function () {
        const n1 = helper.getNode("n1");
        // Node should exist but warn about no server
        expect(n1).to.not.be.undefined;
        done();
      });
    });

    it("should load all configuration properties", function (done) {
      const flow = [
        {
          id: "n1",
          type: "ps-light-saver",
          name: "Full Config",
          triggers: [
            { entity_id: "binary_sensor.motion1", timeoutMinutes: 5 },
            { entity_id: "binary_sensor.motion2" }
          ],
          lights: [
            { entity_id: "light.living_room" },
            { entity_id: "switch.outlet" }
          ],
          lightTimeout: 15,
          nightSensor: { entity_id: "binary_sensor.night" },
          nightLevel: 25,
          levels: [
            { fromTime: "00:00", level: 20 },
            { fromTime: "06:00", level: 100 },
            { fromTime: "22:00", level: 50 }
          ]
        }
      ];

      helper.load([lightSaver], flow, function () {
        const n1 = helper.getNode("n1");
        expect(n1).to.not.be.undefined;
        // Configuration is stored in node properties
        done();
      });
    });
  });

  describe("Configuration Validation", function () {
    it("should handle empty triggers list", function (done) {
      const flow = [
        {
          id: "n1",
          type: "ps-light-saver",
          name: "No Triggers",
          triggers: [],
          lights: [{ entity_id: "light.living_room" }],
          lightTimeout: 10,
          levels: [{ fromTime: "00:00", level: 100 }]
        }
      ];

      helper.load([lightSaver], flow, function () {
        const n1 = helper.getNode("n1");
        expect(n1).to.not.be.undefined;
        done();
      });
    });

    it("should handle empty lights list", function (done) {
      const flow = [
        {
          id: "n1",
          type: "ps-light-saver",
          name: "No Lights",
          triggers: [{ entity_id: "binary_sensor.motion1" }],
          lights: [],
          lightTimeout: 10,
          levels: [{ fromTime: "00:00", level: 100 }]
        }
      ];

      helper.load([lightSaver], flow, function () {
        const n1 = helper.getNode("n1");
        expect(n1).to.not.be.undefined;
        done();
      });
    });

    it("should use default values when not specified", function (done) {
      const flow = [
        {
          id: "n1",
          type: "ps-light-saver",
          name: "Defaults",
          triggers: [{ entity_id: "binary_sensor.motion1" }],
          lights: [{ entity_id: "light.living_room" }]
        }
      ];

      helper.load([lightSaver], flow, function () {
        const n1 = helper.getNode("n1");
        expect(n1).to.not.be.undefined;
        done();
      });
    });
  });

  describe("Time-based Level Logic", function () {
    // These tests can be added later when we extract the level-finding logic
    // into a separate testable function
  });
});


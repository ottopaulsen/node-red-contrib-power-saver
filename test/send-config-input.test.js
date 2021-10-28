const cloneDeep = require("lodash.clonedeep");
const expect = require("expect");
const helper = require("node-red-node-test-helper");
const powerSaver = require("../power-saver.js");
const { DateTime } = require("luxon");
const prices = require("./data/prices");
const result = require("./data/result");
const { testPlan, makeFlow, makePayload } = require("./test-utils");

helper.init(require.resolve("node-red"));

describe("send config as input", () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should send new schedule on output 3", function (done) {
    const flow = makeFlow(3, 2);
    let pass = 1;
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        console.log("Pass " + pass);
        console.log(JSON.stringify(msg, null, 2));
        switch (pass) {
          case 1:
            pass++;
            expect(msg).toHaveProperty("payload", result);
            n1.receive({ payload: { config: { minSaving: 1.0 } } });
            break;
          case 2:
            pass++;
            expect(msg.payload.schedule.length).toEqual(1);
            n1.receive({ payload: makePayload(prices, testPlan.time) });
            break;
          case 3:
            pass++;
            expect(msg.payload.schedule.length).toEqual(1);
            done();
        }
      });
      n1.receive({ payload: makePayload(prices, testPlan.time) });
    });
  });
});

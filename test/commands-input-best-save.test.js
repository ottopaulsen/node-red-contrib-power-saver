const expect = require("expect");
const helper = require("node-red-node-test-helper");
const bestSave = require("../src/strategy-best-save.js");
const prices = require("./data/converted-prices.json");
const result = require("./data/best-save-result.json");
const { testPlan, equalPlan } = require("./test-utils");
const { makeFlow, makePayload } = require("./strategy-best-save-test-utils");

helper.init(require.resolve("node-red"));

describe("send command as input to best save", () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should send output on command", function (done) {
    const flow = makeFlow(3, 2, true);
    let pass = 1;
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n1.sendCurrentValueWhenRescheduling = true;
      n2.on("input", function (msg) {
        switch (pass) {
          case 1:
            pass++;
            expect(equalPlan(result, msg.payload)).toBeTruthy();
            expect(msg.payload.sentOnCommand).toBeFalsy();
            n1.receive({ payload: { commands: { sendSchedule: true } } });
            break;
          case 2:
            expect(equalPlan(result, msg.payload)).toBeTruthy();
            expect(msg.payload.sentOnCommand).toBeTruthy();
            done();
            break;
        }
      });
      n1.receive({ payload: makePayload(prices, testPlan.time) });
    });
  });
});

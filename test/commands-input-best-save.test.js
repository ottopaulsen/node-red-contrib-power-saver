const expect = require("expect");
const cloneDeep = require("lodash.clonedeep");
const helper = require("node-red-node-test-helper");
const bestSave = require("../src/strategy-best-save.js");
const prices = require("./data/converted-prices.json");
const result = require("./data/commands-result-best-save.json");
const { equalPlan } = require("./test-utils");
const { makeFlow } = require("./strategy-best-save-test-utils");

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

  it("should send schedule on command", function (done) {
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
      const payload = cloneDeep(prices);
      payload.time = "2021-10-11T00:00:05.000+02:00";
      payload.commands = { runSchedule: false };
      n1.receive({ payload });
    });
  });

  it("should send output on command", function (done) {
    const flow = makeFlow(3, 2, true);
    let pass = 1;
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      n1.sendCurrentValueWhenRescheduling = true;
      let countOn = 0;
      let countOff = 0;
      n2.on("input", function (msg) {
        switch (pass) {
          case 1:
            pass++;
            expect(equalPlan(result, msg.payload)).toBeTruthy();
            n1.receive({ payload: { commands: { sendOutput: true }, time: "2021-10-11T11:00:05.000+02:00" } });
            setTimeout(() => {
              console.log("countOn = " + countOn + ", countOff = " + countOff);
              expect(countOn).toEqual(1);
              expect(countOff).toEqual(1);
              done();
            }, 50);
            break;
        }
      });
      n3.on("input", function (msg) {
        countOn++;
        expect(msg).toHaveProperty("payload", true);
      });
      n4.on("input", function (msg) {
        countOff++;
        expect(msg).toHaveProperty("payload", false);
      });

      const payload = cloneDeep(prices);
      payload.time = "2021-10-11T00:00:05.000+02:00";
      payload.commands = { runSchedule: false };

      n1.receive({ payload });
    });
  });
});

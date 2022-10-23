const expect = require("expect");
const helper = require("node-red-node-test-helper");
const prices = require("./data/converted-prices.json");
const { testPlan, equalHours } = require("./test-utils");
const { makeFlow, makePayload } = require("./schedule-merger-test-utils");
const scheduleMerger = require("../src/schedule-merger.js");
const { allOff, someOn } = require("./data/merge-schedule-data.js");

helper.init(require.resolve("node-red"));

describe("send command as input to schedule merger", () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should send output on command", function (done) {
    // helper.load(scheduleMerger, flow, function () {
    //   const n1 = helper.getNode("n1");
    //   const n2 = helper.getNode("n2");
    //   n2.on("input", function (msg) {
    //     expect(equalHours(someOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
    //     n1.warn.should.not.be.called;
    //     done();
    //   });
    //   n1.receive({ payload: makePayload("s1", someOn) });
    //   n1.receive({ payload: makePayload("s2", allOff) });
    // });

    const flow = makeFlow("OR");
    let pass = 1;
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        switch (pass) {
          case 1:
            pass++;
            expect(equalHours(someOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
            n1.warn.should.not.be.called;
            expect(msg.payload.sentOnCommand).toBeFalsy();
            n1.receive({ payload: { commands: { sendSchedule: true } } });
            break;
          case 2:
            expect(equalHours(someOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
            expect(msg.payload.sentOnCommand).toBeTruthy();
            done();
            break;
        }
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOff) });
    });
  });
});

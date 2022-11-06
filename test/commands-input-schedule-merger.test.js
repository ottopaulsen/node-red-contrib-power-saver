const expect = require("expect");
const cloneDeep = require("lodash.clonedeep");
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

  it("should send schedule on command", function (done) {
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
            n1.receive({ payload: { commands: { sendSchedule: true } } });
            break;
          case 2:
            expect(equalHours(someOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
            done();
            break;
        }
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOff) });
    });
  });

  it("should send output on command", function (done) {
    const flow = makeFlow("OR");
    let pass = 1;
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      let countOn = 0;
      let countOff = 0;
      n2.on("input", function (msg) {
        switch (pass) {
          case 1:
            pass++;
            expect(equalHours(someOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
            n1.warn.should.not.be.called;
            n1.receive({ payload: { commands: { sendOutput: true }, time: "2021-06-20T01:05:00.000+02:00" } });
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

      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOff) });
    });
  });
  it("should reset on command", function (done) {
    const flow = makeFlow("OR");
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalHours(someOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
        n1.warn.should.not.be.called;
        n1.receive({ payload: { commands: { reset: true } } });
        n1.warn.should.be.calledWithExactly("No schedule");
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOff) });
    });
  });

  it("should replan on command", function (done) {
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
            n1.receive({ payload: { commands: { replan: true }, time: "2021-06-19T00:00:00.000+02:00" } });
            break;
          case 2:
            expect(equalHours(someOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
            done();
            break;
        }
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOff) });
    });
  });
});

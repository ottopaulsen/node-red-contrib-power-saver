const expect = require("chai").expect;
const cloneDeep = require("lodash.clonedeep");
const helper = require("node-red-node-test-helper");
const lowestPrice = require("../src/strategy-lowest-price.js");
const prices = require("./data/converted-prices.json");
const result = require("./data/commands-result-lowest-price.json");
const { equalPlan, equalSchedule } = require("./test-utils");
const { makeFlow } = require("./strategy-lowest-price-test-utils");

helper.init(require.resolve("node-red"));

describe("send command as input to lowest price", () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should send schedule on command", function (done) {
    const flow = makeFlow(180, 2);
    let pass = 1;
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n1.sendCurrentValueWhenRescheduling = true;
      n2.on("input", function (msg) {
        switch (pass) {
          case 1:
            pass++;
            expect(equalSchedule(result.schedule, msg.payload.schedule)).to.equal(true);
            n1.receive({ payload: { commands: { sendSchedule: true } } });
            break;
          case 2:
            expect(equalSchedule(result.schedule, msg.payload.schedule)).to.equal(true);
            done();
            break;
        }
      });
      const payload = cloneDeep(prices);
      payload.time = "2021-10-10T00:00:00.000+02:00";
      n1.receive({ payload });
    });
  });

  it("should send output on command", function (done) {
    const flow = makeFlow(180, 2, true);
    let pass = 1;
    helper.load(lowestPrice, flow, function () {
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
            expect(equalPlan(result, msg.payload, false)).to.equal(true);
            n1.receive({ payload: { commands: { sendOutput: true }, time: "2021-10-11T11:00:05.000+02:00" } });
            setTimeout(() => {
              console.log("countOn = " + countOn + ", countOff = " + countOff);
              expect(countOn).to.equal(1);
              expect(countOff).to.equal(1);
              done();
            }, 50);
            break;
        }
      });
      n3.on("input", function (msg) {
        countOn++;
        expect(msg).to.have.deep.property("payload", true);
      });
      n4.on("input", function (msg) {
        countOff++;
        expect(msg).to.have.deep.property("payload", false);
      });

      const payload = cloneDeep(prices);
      payload.time = "2021-10-10T00:00:05.000+02:00";
      payload.commands = { runSchedule: false };

      n1.receive({ payload });
    });
  });
  it("should reset on command", function (done) {
    const flow = makeFlow(180, 2, true);
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalPlan(result, msg.payload, false)).to.equal(true);
        n1.receive({ payload: { commands: { reset: true } } });
        n1.warn.should.be.calledWithExactly("No price data");
        done();
      });
      const payload = cloneDeep(prices);
      payload.time = "2021-10-11T00:00:05.000+02:00";
      n1.receive({ payload });
    });
  });

  it("should replan on command", function (done) {
    const flow = makeFlow(180, 2, true);
    let pass = 1;
    helper.load(lowestPrice, flow, function () {
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
            expect(equalPlan(result, msg.payload, false)).to.equal(true);
            n1.receive({ payload: { commands: { replan: true }, time: "2021-10-11T00:00:05.000+02:00" } });
            break;
          case 2:
            pass++;
            expect(equalPlan(result, msg.payload, false)).to.equal(true);
            setTimeout(() => {
              console.log("countOn = " + countOn + ", countOff = " + countOff);
              expect(countOn).to.equal(0);
              expect(countOff).to.equal(2);
              done();
            }, 50);
        }
      });
      n3.on("input", function (msg) {
        countOn++;
        expect(msg).to.have.deep.property("payload", true);
      });
      n4.on("input", function (msg) {
        countOff++;
        expect(msg).to.have.deep.property("payload", false);
      });
      const payload = cloneDeep(prices);
      payload.time = "2021-10-11T00:00:05.000+02:00";
      n1.receive({ payload });
    });
  });
});

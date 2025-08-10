const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const bestSave = require("../src/strategy-best-save.js");
const { DateTime } = require("luxon");
const prices = require("./data/converted-prices.json");
const result = require("./data/best-save-result.json");
const reconfigResult = require("./data/reconfigResult");
const { testPlan, equalPlan } = require("./test-utils");
const { makeFlow, makePayload } = require("./strategy-best-save-test-utils");
const cloneDeep = require("lodash.clonedeep");

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
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        switch (pass) {
          case 1:
            pass++;
            expect(equalPlan(result, msg.payload)).to.equal(true);
            n1.receive({ payload: { config: { minSaving: 1.0 } } });
            break;
          case 2:
            pass++;
            expect(msg.payload.schedule.length).to.equal(2);
            n1.receive({ payload: makePayload(prices, testPlan.time) });
            break;
          case 3:
            pass++;
            expect(msg.payload.schedule.length).to.equal(2);
            done();
        }
      });
      n1.receive({ payload: makePayload(prices, testPlan.time) });
    });
  });
  it("should use another minHoursOnAfterMaxSequenceSaved", function (done) {
    const flow = makeFlow(3, 2);
    const changeTime = DateTime.fromISO("2021-06-20T02:00:00.000+02:00");
    let pass = 1;
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        switch (pass) {
          case 1:
            pass++;
            expect(equalPlan(result, msg.payload)).to.equal(true);
            n1.receive({
              payload: {
                config: { minHoursOnAfterMaxSequenceSaved: 5 },
                time: changeTime,
              },
            });
            break;
          case 2:
            pass++;
            reconfigResult.config.minHoursOnAfterMaxSequenceSaved = 5;
            expect(equalPlan(reconfigResult, msg.payload)).to.equal(true);
            const payload = makePayload(prices, testPlan.time);
            payload.time = changeTime;
            n1.receive({ payload });
            break;
          case 3:
            pass++;
            expect(equalPlan(reconfigResult, msg.payload)).to.equal(true);
            done();
        }
      });
      n1.receive({ payload: makePayload(prices, testPlan.time) });
    });
  });
  it.skip("should accept config and price-data together", function (done) {
    // TODO (otto): Fix this test by rewriting using new input
    this.timeout(30000)
    const flow = makeFlow(3, 2);
    let pass = 1;
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        switch (pass) {
          case 1:
            pass++;
            expect(equalPlan(result, msg.payload)).to.equal(true);
            n1.receive({ payload: makePayloadWithConfigAndPrices(prices, testPlan.time) });
            break;
          case 2:
            pass++;
            const priceSum = prices.priceData.reduce((prev, p) => {
              return prev + p.value;
            }, 0);
            const planSum = msg.payload.minutes.reduce((prev, h) => {
              return prev + h.price;
            }, 0);
            expect(Math.round(planSum)).to.equal(Math.round(priceSum * 2));
            done();
        }
      });
      n1.receive({ payload: makePayload(prices, testPlan.time) });
    });
  });
  it.skip("can override", function (done) {
    // TODO (otto): Fix this test
    this.timeout(30000)
    const flow = makeFlow(3, 2, false);
    const time = prices.priceData[0].start;
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      let countOn = 0;
      let countOff = 0;
      let pass = 0;
      n2.on("input", function (msg) {
        pass++;
        n1.warn.should.not.be.called;
        if (pass === 1) {
          setTimeout(() => {
            console.log("countOn = " + countOn + ", countOff = " + countOff);
            expect(countOn).to.equal(2);
            expect(countOff).to.equal(2);
            n1.status.should.be.calledWithExactly({ fill: "yellow", shape: "dot", text: "Override on" });
            done();
          }, 900);
        }
      });
      n3.on("input", function (msg) {
        countOn++;
        expect(msg).to.have.deep.property("payload", true);
        if (countOn === 2) {
          n1.receive({ payload: { config: { override: "on" }, time } });
        }
      });
      n4.on("input", function (msg) {
        countOff++;
        expect(msg).to.have.deep.property("payload", false);
        if (countOff === 1) {
          n1.receive({ payload: { config: { override: "on" }, name: "wrong name" }, time });
        }
        if (countOff === 2) {
          n1.receive({ payload: { config: { override: "on" }, time } });
        }
      });
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
});

function makePayloadWithConfigAndPrices(prices, time) {
  const payload = cloneDeep(prices);
  payload.priceData.forEach((e) => {
    e.value = e.value * 2;
  });
  payload.time = time;
  let entryTime = DateTime.fromISO(payload.time);
  payload.priceData.forEach((e) => {
    e.start = entryTime.toISO();
    entryTime = entryTime.plus({ seconds: 60 });
  });
  payload.config = { minSaving: 0.01 };
  return payload;
}

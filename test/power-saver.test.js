const cloneDeep = require("lodash.clonedeep");
const expect = require("expect");
const helper = require("node-red-node-test-helper");
const powerSaver = require("../power-saver.js");
const { DateTime } = require("luxon");

const prices = require("./data/prices");
const result = require("./data/result");
const { testPlan: plan, makeFlow, makePayload } = require("./test-utils");

helper.init(require.resolve("node-red"));

describe("power-saver Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "power-saver", name: "test name" }];
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).toHaveProperty("name", "test name");
      done();
    });
  });

  it("should log error when illegal data is received", function (done) {
    const flow = [{ id: "n1", type: "power-saver", name: "test name" }];
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      n1.receive({});
      n1.warn.should.be.calledWithExactly("Payload missing");
      n1.receive({ payload: "Error" });
      n1.warn.should.be.calledWithExactly("Payload must be an object");
      n1.receive({ payload: { today: [], tomorrow: [] } });
      n1.warn.should.be.calledWithExactly("Payload has no data");

      ["start", "value"].forEach((attr) => {
        const testData1 = {
          today: cloneDeep(prices.today),
          tomorrow: cloneDeep(prices.tomorrow),
        };
        delete testData1.today[3][attr];
        n1.receive({ payload: testData1 });
        n1.warn.should.be.calledWithExactly(
          "Malformed entries in payload.today. All entries must contain start and value."
        );
      });

      n1.receive({ payload: cloneDeep(prices) });
      n1.warn.should.not.be.called;
      done();
    });
  });
  it("should send new schedule on output 3", function (done) {
    const flow = makeFlow(3, 2);
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", result);
        n1.warn.should.not.be.called;
        done();
      });
      n3.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", true);
      });
      n4.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", false);
      });
      n1.receive({ payload: makePayload(prices, plan.time) });
    });
  });

  it("can schedule one day", function (done) {
    const values = [1, 1, 1, 1, 1, 1, 1, 5, 4, 3];
    const schedule = [
      {
        time: "2021-06-20T01:50:00.000+02:00",
        value: true,
      },
      {
        time: "2021-06-20T01:50:00.070+02:00",
        value: false,
      },
      {
        time: "2021-06-20T01:50:00.090+02:00",
        value: true,
      },
    ];
    const flow = makeFlow(4, 2);
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const mPrices = cloneDeep(prices);
      delete mPrices.tomorrow;
      for (i = 0; i < mPrices.today.length; i++) {
        mPrices.today[i].value = values[i];
      }
      const payload = makePayload(mPrices, plan.time);
      n1.receive({ payload });
    });
  });

  it("should schedule over midnight", function (done) {
    const values1 = [1, 1, 1, 1, 1, 1, 1, 5, 4, 3];
    const values2 = [2, 1, 5, 5, 5, 5, 5, 5, 5, 5];
    const schedule = [
      {
        time: "2021-06-20T01:50:00.000+02:00",
        value: true,
      },
      {
        time: "2021-06-20T01:50:00.070+02:00",
        value: false,
      },
      {
        time: "2021-06-20T01:50:00.110+02:00",
        value: true,
      },
    ];
    const flow = makeFlow(4, 2);
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const mPrices = cloneDeep(prices);
      for (i = 0; i < mPrices.today.length; i++) {
        mPrices.today[i].value = values1[i];
        mPrices.tomorrow[i].value = values2[i];
      }
      const payload = makePayload(mPrices, plan.time);
      n1.receive({ payload });
    });
  });
  it("works for Tibber data", function (done) {
    const tibberData = require("./data/tibber_prices.json");
    const tibberResult = require("./data/tibber_result.json");
    const flow = makeFlow(4, 2);
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", tibberResult);
        done();
      });
      n1.receive({ ...tibberData });
    });
  });
});

"use strict";
const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("expect");
const helper = require("node-red-node-test-helper");
const node = require("../src/strategy-heat-capacitor.js");
const prices = require("./data/converted-prices.json");
const multiTrade = require("./data/multiple-trades.json");
const nanTest = require("./data/heat-capacitor-prices-NaN-test.json");

helper.init(require.resolve("node-red"));

describe("ps-strategy-heat-capacitor node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "ps-strategy-heat-capacitor", name: "Temp. Adj." }];
    helper.load(node, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).toHaveProperty("name", "Temp. Adj.");
      done();
    });
  });

  it("should log error when illegal data is received", function (done) {
    const flow = [{ id: "n1", type: "ps-strategy-heat-capacitor", name: "Temp. Adj." }];
    helper.load(node, flow, function () {
      const n1 = helper.getNode("n1");
      n1.receive({});
      n1.warn.should.be.calledWithExactly("No payload");
      n1.receive({ payload: "Error" });
      n1.warn.should.be.calledWithExactly("Payload is not an object");
      n1.receive({ payload: [] });
      n1.warn.should.be.calledWithExactly("Payload is missing priceData");
      n1.receive({ payload: { priceData: [] } });
      n1.warn.should.be.calledWithExactly("priceData is empty");
      n1.receive({ payload: { priceData: { today: [], tomorrow: [] } } });
      n1.warn.should.be.calledWithExactly("Illegal priceData in payload. Did you use the receive-price node?");

      ["start", "value"].forEach((attr) => {
        const testData1 = cloneDeep(prices);
        delete testData1.priceData[3][attr];
        n1.receive({ payload: testData1 });
        n1.warn.should.be.calledWithExactly(
          "Malformed entries in priceData. All entries must contain start and value."
        );
      });

      n1.receive({ payload: cloneDeep(prices) });
      n1.warn.should.not.be.called;
      done();
    });
  });

  it("should be configurable", function (done) {
    const flow = [{ id: "n1", type: "ps-strategy-heat-capacitor", name: "Heat Capacitor" }];
    helper.load(node, flow, function () {
      const n1 = helper.getNode("n1");
      n1.receive({
        payload: {
          config: {
            timeHeat1C: 1,
            timeCool1C: 2,
            setpoint: 3,
            maxTempAdjustment: 4,
            minSavings: 5,
            boostTempHeat: 6,
            boostTempCool: 7,
          },
        },
      });
      expect(n1).toHaveProperty("timeHeat1C", 1);
      expect(n1).toHaveProperty("timeCool1C", 2);
      expect(n1).toHaveProperty("boostTempHeat", 6);
      expect(n1).toHaveProperty("boostTempCool", 7);
      expect(n1).toHaveProperty("setpoint", 3);
      expect(n1).toHaveProperty("maxTempAdjustment", 4);
      expect(n1).toHaveProperty("minSavings", 5);
      n1.receive({ payload: { config: { setpoint: 24 } } });
      expect(n1).toHaveProperty("setpoint", 24);
      done();
    });
  });

  it("should plan correctly", function (done) {
    const result = 0.5;
    const flow = makeFlow();
    helper.load(node, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      let bothReceived = false;
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", 22.5);
        n1.warn.should.not.be.called;
        bothReceived ? done() : (bothReceived = true);
      });
      n3.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", -0.5);
        n1.warn.should.not.be.called;
        bothReceived ? done() : (bothReceived = true);
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      const p = cloneDeep(prices);
      p.time = time;
      n1.receive({ payload: p });
    });
  });

  it("should plan correctly, multiTrade", function (done) {
    const result = 0.5;
    const flow = makeFlow();
    helper.load(node, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      const n5 = helper.getNode("n5");
      let bothReceived = false;
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", 24.5);
        n1.warn.should.not.be.called;
        bothReceived ? done() : (bothReceived = true);
      });
      n3.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", 1.5);
        n1.warn.should.not.be.called;
        bothReceived ? done() : (bothReceived = true);
      });
      n5.on("input", function (msg) {
        expect(msg).toHaveProperty("payload.current_setpoint", 24.5);
        n1.warn.should.not.be.called;
      });
      const time = DateTime.fromISO(multiTrade.priceData[4].start).plus({ minutes: 10 });
      multiTrade.time = time;
      n1.receive({ payload: multiTrade });
    });
  });

  it("should merge and trim priceData", function (done) {
    const flow = makeFlow();
    helper.load(node, flow, function () {
      const n1 = helper.getNode("n1");
      n1.receive({ payload: multiTrade });
      n1.receive({ payload: prices });
      expect(n1.priceData.length).toEqual(72);
      done();
    });
  });

  it("should plan correctly, NaN test", function (done) {
    const result = 0.5;
    const flow = [
      {
        id: "n1",
        type: "ps-strategy-heat-capacitor",
        name: "Temp. Adj.",
        timeHeat1C: 480,
        timeCool1C: 360,
        boostTempHeat: 2,
        boostTempCool: 2,
        setpoint: 20,
        maxTempAdjustment: 1,
        minSavings: 0.08,
        wires: [["n2"], ["n3"], ["n4"], ["n5"]],
      },
      { id: "n2", type: "helper" },
      { id: "n3", type: "helper" },
      { id: "n4", type: "helper" },
      { id: "n5", type: "helper" },
    ];
    helper.load(node, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      const n5 = helper.getNode("n5");
      let bothReceived = false;
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", 17);
        n1.warn.should.not.be.called;
        bothReceived ? done() : (bothReceived = true);
      });
      n3.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", -3);
        n1.warn.should.not.be.called;
        bothReceived ? done() : (bothReceived = true);
      });
      n5.on("input", function (msg) {
        expect(msg).toHaveProperty("payload.current_setpoint", 17);
        n1.warn.should.not.be.called;
      });
      const time = DateTime.fromISO("2022-12-06T10:51:48.126+01:00");
      nanTest.time = time;
      n1.receive({ payload: nanTest });
    });
  });

  it("should support dynamic commands", function (done) {
    const result = 0.5;
    const flow = makeFlow();
    helper.load(node, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      const n5 = helper.getNode("n5");
      const numInputs = [0, 0, 0, 0];
      const expectedNumInputs = [2, 2, 2, 2];
      function testNumInputs() {
        if (numInputs.every((e, i) => e === expectedNumInputs[i])) {
          done();
        }
      }
      n2.on("input", function (msg) {
        numInputs[0]++;
        testNumInputs();
      });
      n3.on("input", function (msg) {
        numInputs[1]++;
        testNumInputs();
      });
      n4.on("input", function (msg) {
        numInputs[2]++;
        testNumInputs();
      });
      n5.on("input", function (msg) {
        numInputs[3]++;
        testNumInputs();
      });
      const time = DateTime.fromISO(multiTrade.priceData[4].start).plus({ minutes: 10 });
      const outputCommand = { payload: { commands: { sendOutput: true } } };
      const scheduleCommand = { payload: { commands: { sendSchedule: true } } };
      multiTrade.time = time;

      n1.receive({ payload: multiTrade });
      n1.receive(outputCommand);
      n1.receive(scheduleCommand);
    });
  });
});

function makeFlow() {
  return [
    {
      id: "n1",
      type: "ps-strategy-heat-capacitor",
      name: "Temp. Adj.",
      timeHeat1C: 60,
      timeCool1C: 50,
      boostTempHeat: 1,
      boostTempCool: 1,
      setpoint: 23,
      maxTempAdjustment: 0.5,
      minSavings: 0.08,
      wires: [["n2"], ["n3"], ["n4"], ["n5"]],
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" },
    { id: "n4", type: "helper" },
    { id: "n5", type: "helper" },
  ];
}

function makePayload(prices, time) {
  const payload = cloneDeep(prices);
  payload.time = time;
  let entryTime = DateTime.fromISO(payload.time);
  payload.priceData.forEach((e) => {
    e.start = entryTime.toISO();
    entryTime = entryTime.plus({ milliseconds: 10 });
  });
  return payload;
}

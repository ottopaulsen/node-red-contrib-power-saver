const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("expect");
const helper = require("node-red-node-test-helper");
const lowestPrice = require("../src/strategy-lowest-price.js");
const prices = require("./data/converted-prices.json");
const negativePrices = require("./data/negative-prices.json");
const { version } = require("../package.json");
const { makeFlow, makePayload } = require("./strategy-lowest-price-test-utils");

helper.init(require.resolve("node-red"));

describe("ps-strategy-lowest-price node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "ps-strategy-lowest-price", name: "test name" }];
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).toHaveProperty("name", "test name");
      done();
    });
  });

  it("should log error when illegal data is received", function (done) {
    const flow = [{ id: "n1", type: "ps-strategy-lowest-price", name: "test name" }];
    helper.load(lowestPrice, flow, function () {
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
  it("should plan correct continuous schedule", function (done) {
    const resultContinuous = require("./data/lowest-price-result-cont.json");
    const flow = makeFlow(4);
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", resultContinuous.schedule);
        expect(msg.payload).toHaveProperty("config", resultContinuous.config);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should plan correct splitted schedule", function (done) {
    const resultSplitted = require("./data/lowest-price-result-split.json");
    const flow = makeFlow(6);
    flow[0].doNotSplit = false;
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", resultSplitted.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should plan correct negative prices continuous schedule", function (done) {
    const resultContinuous = require("./data/lowest-price-result-neg-cont.json");
    const flow = makeFlow(5, null, true, "00", "00");
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", resultContinuous.schedule);
        expect(msg.payload).toHaveProperty("config", resultContinuous.config);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(negativePrices, time) });
    });
  });
  it("should plan correct negative prices splitted schedule", function (done) {
    const resultSplitted = require("./data/lowest-price-result-neg-split.json");
    const flow = makeFlow(5, null, true, "00", "00");
    flow[0].doNotSplit = false;
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", resultSplitted.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(negativePrices, time) });
    });
  });
  it("should plan correct continuous schedule with max price ok", function (done) {
    const resultContinuousMax = require("./data/lowest-price-result-cont-max.json");
    const flow = makeFlow(4, 1.0);
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", resultContinuousMax.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should plan correct continuous schedule with max price too high", function (done) {
    const resultContinuousMax = require("./data/lowest-price-result-cont-max-fail.json");
    const flow = makeFlow(4, 0.23);
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", resultContinuousMax.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should plan correct splitted schedule with max price", function (done) {
    const resultSplittedMax = require("./data/lowest-price-result-split-max.json");
    const flow = makeFlow(6, 0.51);
    flow[0].doNotSplit = false;
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", resultSplittedMax.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should plan correct for all day period - 00-00", function (done) {
    const resultAllDay = require("./data/lowest-price-result-split-allday.json");
    const flow = makeFlow(8);
    flow[0].doNotSplit = false;
    flow[0].fromTime = "00";
    flow[0].toTime = "00";
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", resultAllDay.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should plan correct for all day period - 10-10", function (done) {
    const resultAllDay10 = require("./data/lowest-price-result-split-allday10.json");
    const flow = makeFlow(10);
    flow[0].doNotSplit = false;
    flow[0].fromTime = "10";
    flow[0].toTime = "10";
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        const config = cloneDeep(resultAllDay10.config);
        expect(msg.payload).toHaveProperty("schedule", resultAllDay10.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should plan correct for all day period - 10-10 outside on", function (done) {
    const resultAllDay10 = require("./data/lowest-price-result-split-allday10.json");
    const flow = makeFlow(10);
    flow[0].doNotSplit = false;
    flow[0].fromTime = "10";
    flow[0].toTime = "10";
    flow[0].outputOutsidePeriod = true;
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        const config = cloneDeep(resultAllDay10.config);
        config.outputOutsidePeriod = true;
        expect(msg.payload).toHaveProperty("schedule", resultAllDay10.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should plan correct for all day period - 10-10 nosched on", function (done) {
    const resultAllDay10 = require("./data/lowest-price-result-split-allday10.json");
    const flow = makeFlow(10);
    flow[0].doNotSplit = false;
    flow[0].fromTime = "10";
    flow[0].toTime = "10";
    flow[0].outputIfNoSchedule = "true";
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        const config = cloneDeep(resultAllDay10.config);
        config.outputIfNoSchedule = true;
        expect(msg.payload).toHaveProperty("schedule", resultAllDay10.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should plan correct outside selected period - split", function (done) {
    const resultSplitted = require("./data/lowest-price-result-split.json");
    const flow = makeFlow(6);
    flow[0].doNotSplit = false;
    flow[0].outputOutsidePeriod = true;
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        const schedule = cloneDeep(resultSplitted.schedule);
        const config = cloneDeep(resultSplitted.config);
        schedule[0].value = true;
        schedule.splice(1, 0, { time: "2021-10-11T10:00:00.000+02:00", value: false, countHours: 10 });
        schedule.splice(4, 0, { time: "2021-10-11T20:00:00.000+02:00", value: true, countHours: 14 });
        schedule.splice(5, 0, { time: "2021-10-12T10:00:00.000+02:00", value: false, countHours: 14 });
        schedule.splice(schedule.length - 1, 1);
        config.outputOutsidePeriod = true;
        const res = msg.payload.schedule.map((s) => ({ time: s.time, value: s.value }));
        const exp = schedule.map((s) => ({ time: s.time, value: s.value }));
        exp.pop();
        expect(res).toEqual(exp);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should plan correct outside selected period - cont", function (done) {
    const resultContinuous = require("./data/lowest-price-result-cont.json");
    const flow = makeFlow(4);
    flow[0].doNotSplit = true;
    flow[0].outputOutsidePeriod = true;
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        const schedule = cloneDeep(resultContinuous.schedule);
        const config = cloneDeep(resultContinuous.config);
        schedule[0].value = true;
        schedule.splice(1, 0, { time: "2021-10-11T10:00:00.000+02:00", value: false });
        schedule.splice(4, 0, { time: "2021-10-11T20:00:00.000+02:00", value: true });
        schedule.splice(5, 0, { time: "2021-10-12T10:00:00.000+02:00", value: false });
        schedule.splice(schedule.length, 0, { time: "2021-10-12T20:00:00.000+02:00", value: true });
        config.outputOutsidePeriod = true;
        const res = msg.payload.schedule.map((s) => ({ time: s.time, value: s.value }));
        const exp = schedule.map((s) => ({ time: s.time, value: s.value }));
        exp.splice(8, 1);
        expect(res).toEqual(exp);
        expect(msg.payload).toHaveProperty("config", config);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should work with 0 hours on", function (done) {
    const result = [
      { time: "2021-10-11T00:00:00.000+02:00", value: false, countHours: 48 },
      { time: "2021-10-13T00:00:00.000+02:00", value: true, countHours: null },
    ];
    const flow = makeFlow(0);
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", result);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should work with 0 hours on outside on", function (done) {
    const result = [
      { time: "2021-10-11T00:00:00.000+02:00", value: true, countHours: 10 },
      { time: "2021-10-11T10:00:00.000+02:00", value: false, countHours: 10 },
      { time: "2021-10-11T20:00:00.000+02:00", value: true, countHours: 14 },
      { time: "2021-10-12T10:00:00.000+02:00", value: false, countHours: 10 },
      { time: "2021-10-12T20:00:00.000+02:00", value: true, countHours: 4 },
    ];
    const flow = makeFlow(0);
    flow[0].outputOutsidePeriod = true;
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", result);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should work with 1 hours on", function (done) {
    const result = [
      { time: "2021-10-11T00:00:00.000+02:00", value: false, countHours: 12 },
      { time: "2021-10-11T12:00:00.000+02:00", value: true, countHours: 1 },
      { time: "2021-10-11T13:00:00.000+02:00", value: false, countHours: 25 },
      { time: "2021-10-12T14:00:00.000+02:00", value: true, countHours: 1 },
      { time: "2021-10-12T15:00:00.000+02:00", value: false, countHours: 9 },
      { time: "2021-10-13T00:00:00.000+02:00", value: true, countHours: null },
    ];
    const flow = makeFlow(1);
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", result);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should work with 24 hours on", function (done) {
    const result = [
      { time: "2021-10-11T00:00:00.000+02:00", value: false, countHours: 10 },
      { time: "2021-10-11T10:00:00.000+02:00", value: true, countHours: 10 },
      { time: "2021-10-11T20:00:00.000+02:00", value: false, countHours: 14 },
      { time: "2021-10-12T10:00:00.000+02:00", value: true, countHours: 10 },
      { time: "2021-10-12T20:00:00.000+02:00", value: false, countHours: 4 },
      { time: "2021-10-13T00:00:00.000+02:00", value: true, countHours: null },
    ];
    const flow = makeFlow(24);
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", result);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });

  it("should work with data for only current day", function (done) {
    const oneDayPrices = {};
    oneDayPrices.priceData = prices.priceData.filter((d) => d.start.startsWith("2021-10-11"));
    const result = [
      { time: "2021-10-11T00:00:00.000+02:00", value: false, countHours: 12 },
      { time: "2021-10-11T12:00:00.000+02:00", value: true, countHours: 1 },
      { time: "2021-10-11T13:00:00.000+02:00", value: false, countHours: 11 },
      { time: "2021-10-12T00:00:00.000+02:00", value: true, countHours: null },
    ];
    const flow = makeFlow(1);
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", result);
        n1.warn.should.not.be.called;
        done();
      });
      n3.on("input", function (msg) {
        console.log("n3 inout: " + msg);
        expect(msg.payload).toEqual(true);
      });
      n4.on("input", function (msg) {
        console.log("n4 inout: " + msg);
        expect(msg.payload).toEqual(false);
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(oneDayPrices, time) });
    });
  });

  it("should handle hours on > period", function (done) {
    const result = [
      { time: "2021-10-11T00:00:00.000+02:00", value: true, countHours: 48 },
      { time: "2021-10-13T00:00:00.000+02:00", value: false, countHours: null },
    ];
    const flow = [
      {
        id: "n1",
        type: "ps-strategy-lowest-price",
        name: "test name",
        fromTime: "17",
        toTime: "22",
        hoursOn: 6,
        doNotSplit: true,
        sendCurrentValueWhenRescheduling: true,
        outputIfNoSchedule: false,
        outputOutsidePeriod: true,
        wires: [["n3"], ["n4"], ["n2"]],
      },
      { id: "n2", type: "helper" },
      { id: "n3", type: "helper" },
      { id: "n4", type: "helper" },
    ];
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      let countOn = 0;
      let countOff = 0;
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", result);
        n1.warn.should.not.be.called;
        setTimeout(() => {
          expect(countOn).toEqual(1);
          expect(countOff).toEqual(0);
          done();
        }, 100);
      });
      n3.on("input", function (msg) {
        countOn++;
      });
      n4.on("input", function (msg) {
        countOff++;
      });

      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("should handle hours on > period, false outside", function (done) {
    const result = [
      { time: "2021-10-11T00:00:00.000+02:00", value: false, countHours: 17 },
      { time: "2021-10-11T17:00:00.000+02:00", value: true, countHours: 5 },
      { time: "2021-10-11T22:00:00.000+02:00", value: false, countHours: 19 },
      { time: "2021-10-12T17:00:00.000+02:00", value: true, countHours: 5 },
      { time: "2021-10-12T22:00:00.000+02:00", value: false, countHours: 2 },
      { time: "2021-10-13T00:00:00.000+02:00", value: true, countHours: null },
    ];
    const flow = [
      {
        id: "n1",
        type: "ps-strategy-lowest-price",
        name: "test name",
        fromTime: "17",
        toTime: "22",
        hoursOn: 6,
        doNotSplit: true,
        sendCurrentValueWhenRescheduling: true,
        outputIfNoSchedule: true,
        outputOutsidePeriod: false,
        wires: [["n3"], ["n4"], ["n2"]],
      },
      { id: "n2", type: "helper" },
      { id: "n3", type: "helper" },
      { id: "n4", type: "helper" },
    ];
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      let countOn = 0;
      let countOff = 0;
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", result);
        n1.warn.should.not.be.called;
        setTimeout(() => {
          expect(countOn).toEqual(0);
          expect(countOff).toEqual(1);
          done();
        }, 100);
      });
      n3.on("input", function (msg) {
        countOn++;
      });
      n4.on("input", function (msg) {
        countOff++;
      });

      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(prices, time) });
    });
  });
  it("handles period end on hour 0 - 12 hours", function (done) {
    const input = require("./data/tibber-data-end-0.json");
    const result = require("./data/tibber-result-end-0.json");
    result.version = version;
    result.strategyNodeId = "n1";
    result.current = false;
    const flow = [
      {
        id: "n1",
        type: "ps-strategy-lowest-price",
        name: "test name",
        fromTime: "16",
        toTime: "00",
        hoursOn: 3,
        maxPrice: null,
        doNotSplit: false,
        sendCurrentValueWhenRescheduling: true,
        outputIfNoSchedule: false,
        outputOutsidePeriod: false,
        override: "auto",
        wires: [["n3"], ["n4"], ["n2"]],
      },
      { id: "n2", type: "helper" },
      { id: "n3", type: "helper" },
      { id: "n4", type: "helper" },
    ];
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", result);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(input, time) });
    });
  });
  it("handles period end on hour 0 - 24 hours", function (done) {
    const input = require("./data/tibber-data-end-0-24h.json");
    const result = require("./data/tibber-result-end-0-24h.json");
    result.version = version;
    result.strategyNodeId = "n1";
    result.current = false;
    const flow = [
      {
        id: "n1",
        type: "ps-strategy-lowest-price",
        name: "test name",
        fromTime: "16",
        toTime: "00",
        hoursOn: 3,
        maxPrice: null,
        doNotSplit: false,
        sendCurrentValueWhenRescheduling: true,
        outputIfNoSchedule: false,
        outputOutsidePeriod: false,
        wires: [["n3"], ["n4"], ["n2"]],
      },
      { id: "n2", type: "helper" },
      { id: "n3", type: "helper" },
      { id: "n4", type: "helper" },
    ];
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", result);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      n1.receive({ payload: makePayload(input, time) });
    });
  });
  it("fix bug", function (done) {
    const input = require("./data/lowest-price-input-missing-end.json");
    const result = require("./data/lowest-price-result-missing-end.json");
    result.payload.version = version;
    result.payload.strategyNodeId = "n1";
    result.payload.current = false;
    const flow = [
      {
        id: "n1",
        type: "ps-strategy-lowest-price",
        name: "test name",
        fromTime: "22",
        toTime: "08",
        hoursOn: 3,
        maxPrice: null,
        doNotSplit: true,
        sendCurrentValueWhenRescheduling: true,
        outputIfNoSchedule: false,
        outputOutsidePeriod: false,
        wires: [["n3"], ["n4"], ["n2"]],
      },
      { id: "n2", type: "helper" },
      { id: "n3", type: "helper" },
      { id: "n4", type: "helper" },
    ];
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", result.payload);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO(prices.priceData[10].start);
      result.payload.time = time.toISO();
      n1.receive({ payload: makePayload(input, time) });
    });
  });
});

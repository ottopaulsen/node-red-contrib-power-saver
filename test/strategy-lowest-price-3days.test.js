const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const lowestPrice = require("../src/strategy-lowest-price.js");
const prices = require("./data/nordpool-3-days-prices.json");
const result = require("./data/nordpool-3-days-result.json");
const { testPlan: plan } = require("./test-utils");

helper.init(require.resolve("node-red"));

describe("ps-strategy-lowest-price with data day before", function () {
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
      expect(n1).to.have.property("name", "test name");
      done();
    });
  });

  it("should handle data from day before", function (done) {
    const flow = makeFlow(60);
    const pricesDay1 = cloneDeep(prices);
    const pricesDay2 = cloneDeep(prices);
    pricesDay1.priceData.splice(48, 24);
    pricesDay2.priceData.splice(0, 24);
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      let count = 0;
      n2.on("input", function (msg) {
        if (count === 1) {
          expect(msg.payload).to.have.deep.property("schedule", result.schedule);
          done();
        }
        count++;
      });
      let time = DateTime.fromISO(pricesDay1.priceData[10].start);
      n1.receive({ payload: makePayload(pricesDay1, time) });
      setTimeout(() => {
        time = DateTime.fromISO(pricesDay2.priceData[10].start);
        n1.receive({ payload: makePayload(pricesDay2, time) });
      }, 500);
    });
  });

  it("should handle new price data after midnight", function (done) {
    const flow = makeFlow(60);
    const pricesDay1 = cloneDeep(prices);
    const pricesDay2 = cloneDeep(prices);
    const res = cloneDeep(result);
    res.schedule.splice(3, 2);
    res.hours.splice(48, 24);
    res.schedule[2].countMinutes = 19 * 60;
    pricesDay1.priceData.splice(48, 24);
    pricesDay2.priceData.splice(48, 24);
    pricesDay2.priceData.splice(0, 24);
    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      let count = 0;
      n2.on("input", function (msg) {
        if (count === 1) {
          expect(msg.payload).to.have.deep.property("schedule", res.schedule);
          done();
        }
        count++;
      });
      let time = DateTime.fromISO(pricesDay1.priceData[10].start);
      n1.receive({ payload: makePayload(pricesDay1, time) });
      setTimeout(() => {
        time = DateTime.fromISO(pricesDay2.priceData[1].start);
        n1.receive({ payload: makePayload(pricesDay2, time) });
      }, 100);
    });
  });
});

function makeFlow(minutesOn) {
  return [
    {
      id: "n1",
      type: "ps-strategy-lowest-price",
      name: "test name",
      fromHour: 19,
      fromMinute: 0,
      toHour: 7,
      toMinute: 0,
      minutesOn,
      doNotSplit: false,
      sendCurrentValueWhenRescheduling: true,
      outputIfNoSchedule: false,
      wires: [["n3"], ["n4"], ["n2"]],
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" },
    { id: "n4", type: "helper" },
  ];
}

function makePayload(prices, time) {
  const payload = cloneDeep(prices);
  payload.time = time;
  // let entryTime = DateTime.fromISO(payload.time);
  // payload.priceData.forEach((e) => {
  //   e.start = entryTime.toISO();
  //   entryTime = entryTime.plus({ milliseconds: 10 });
  // });
  return payload;
}

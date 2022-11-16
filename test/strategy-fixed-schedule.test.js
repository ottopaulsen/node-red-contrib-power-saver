const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("expect");
const helper = require("node-red-node-test-helper");
const fixedSchedule = require("../src/strategy-fixed-schedule.js");
const prices = require("./data/converted-prices.json");
const result = require("./data/fixed-schedule-result.json");
const { testPlan: plan, equalPlan, equalSchedule } = require("./test-utils");

helper.init(require.resolve("node-red"));

describe("ps-strategy-fixed-schedule node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "ps-strategy-fixed-schedule", name: "test name" }];
    helper.load(fixedSchedule, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).toHaveProperty("name", "test name");
      done();
    });
  });

  it("should turn on 2 to 6", function (done) {
    const flow = makeFlow();
    const expected = cloneDeep(result);
    helper.load(fixedSchedule, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalPlan(expected, msg.payload)).toBeTruthy();
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: prices, time: prices.priceData[0].start });
    });
  });
  it("should send correct if no schedule", function (done) {
    const flow = makeFlow(true);
    const expected = cloneDeep(result);
    expected.schedule.push({
      time: "2021-10-13T00:00:00.000+02:00",
      value: true,
      countHours: null,
    });
    expected.config.outputIfNoSchedule = true;

    helper.load(fixedSchedule, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalPlan(expected, msg.payload)).toBeTruthy();
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: prices, time: prices.priceData[0].start });
    });
  });
  it("should work only on days specified", function (done) {
    const flow = makeFlow(false);
    flow[0].periods.splice(1, 1);
    flow[0].days["Tue"] = false;
    const expected = [
      {
        time: "2021-10-11T00:00:00.000+02:00",
        value: true,
        countHours: 24,
      },
      {
        time: "2021-10-12T00:00:00.000+02:00",
        value: false,
        countHours: 24,
      },
    ];

    helper.load(fixedSchedule, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalSchedule(expected, msg.payload.schedule)).toBeTruthy();
        done();
      });
      n1.receive({ payload: prices, time: prices.priceData[0].start });
    });
  });
});

function makeFlow(outputIfNoSchedule = false) {
  return [
    {
      id: "n1",
      type: "ps-strategy-fixed-schedule",
      name: "test name",
      days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
      periods: [
        { start: "02", value: true },
        { start: "06", value: false },
      ],
      sendCurrentValueWhenRescheduling: true,
      outputIfNoSchedule,
      // validFrom: null,
      // validTo: null,
      wires: [["n3"], ["n4"], ["n2"]],
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" },
    { id: "n4", type: "helper" },
  ];
}

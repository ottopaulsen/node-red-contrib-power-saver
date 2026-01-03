const { DateTime } = require("luxon");
const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const input = require("./data/bug-231-input.json");
const output = require("./data/bug-231-output.json");
const lowestPrice = require("../src/strategy-lowest-price.js");
const { version } = require("../package.json");
const { makePayload } = require("./strategy-lowest-price-test-utils.js");

helper.init(require.resolve("node-red"));

describe("ps-strategy-lowest-price-bug 231", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("find bug 231 a", function (done) {
    const flow = [
      {
        id: "n1",
        type: "ps-strategy-lowest-price",
        name: "test name",
        fromHour: output.config.fromHour,
        fromMinute: output.config.fromMinute,
        toHour: output.config.toHour,
        toMinute: output.config.toMinute,
        minutesOn: output.config.minutesOn,
        maxPrice: output.config.maxPrice,
        doNotSplit: output.config.doNotSplit,
        sendCurrentValueWhenRescheduling: output.config.sendCurrentValueWhenRescheduling,
        outputIfNoSchedule: output.config.outputIfNoSchedule,
        outputOutsidePeriod: output.config.outputOutsidePeriod,
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
        expect(msg.payload).to.have.deep.property("schedule", output.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = output.time;
      n1.receive({ payload: makePayload(input, time) });
    });
  });
  it("find bug 231 b", function (done) {
    const flow = [
      {
        id: "n1",
        type: "ps-strategy-lowest-price",
        name: "test name",
        fromHour: 4,
        fromMinute: 30,
        toHour: 5,
        toMinute: 30,
        minutesOn: output.config.minutesOn,
        maxPrice: output.config.maxPrice,
        doNotSplit: output.config.doNotSplit,
        sendCurrentValueWhenRescheduling: output.config.sendCurrentValueWhenRescheduling,
        outputIfNoSchedule: output.config.outputIfNoSchedule,
        outputOutsidePeriod: output.config.outputOutsidePeriod,
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
        const expectedSchedule = [
          { time: "2025-11-22T00:00:00.000+01:00", value: false, countMinutes: 280 },
          { time: "2025-11-22T04:40:00.000+01:00", value: true, countMinutes: 50 },
          { time: "2025-11-22T05:30:00.000+01:00", value: false, countMinutes: 1380 },
          { time: "2025-11-23T04:30:00.000+01:00", value: true, countMinutes: 50 },
          { time: "2025-11-23T05:20:00.000+01:00", value: false, countMinutes: 1120 },
        ];
        expect(msg.payload).to.have.deep.property("schedule", expectedSchedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = output.time;
      n1.receive({ payload: makePayload(input, time) });
    });
  });
});

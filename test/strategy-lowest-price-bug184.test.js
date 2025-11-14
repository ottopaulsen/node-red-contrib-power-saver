const { DateTime } = require("luxon");
const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const lowestPrice = require("../src/strategy-lowest-price.js");
const { version } = require("../package.json");
const { makePayload } = require("./strategy-lowest-price-test-utils.js");

helper.init(require.resolve("node-red"));

describe("ps-strategy-lowest-price-bugs", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("use outputOutsidePeriod correct when period spans midnight", function (done) {
    const input = require("./data/lowest-price-bug184-input.json");
    const result = require("./data/lowest-price-bug184.json");
    result.version = version;
    result.strategyNodeId = "n1";
    result.current = false;
    const flow = [
      {
        id: "n1",
        type: "ps-strategy-lowest-price",
        name: "test name",
        fromHour: "20",
        fromMinute: 0,
        toHour: "05",
        toMinute: 0,
        minutesOn: 240,
        maxPrice: null,
        doNotSplit: false,
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
      n2.on("input", function (msg) {
        result.current = msg.payload.current;
        expect(msg.payload).to.have.deep.property("schedule", result.schedule);
        n1.warn.should.not.be.called;
        done();
      });
      const time = DateTime.fromISO("2023-11-09T16:08:07.158+01:00");
      result.time = time.toISO();
      n1.receive({ payload: makePayload(input, time) });
    });
  });
});

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

  it("cannot reproduce this bug", function (done) {
    const input = require("./data/lowest-price-bug187-input.json");
    const result = require("./data/lowest-price-bug187.json");
  //   result.version = version;
  //   result.strategyNodeId = "n1";
  //   result.current = false;
  //   const flow = [
  //     {
  //       id: "n1",
  //       type: "ps-strategy-lowest-price",
  //       name: "test name",
  //       fromTime: "00",
  //       toTime: "00",
  //       hoursOn: 3,
  //       maxPrice: 0.35,
  //       doNotSplit: false,
  //       sendCurrentValueWhenRescheduling: true,
  //       outputIfNoSchedule: false,
  //       outputOutsidePeriod: false,
  //       contextStorage: "memory",
  //       wires: [["n3"], ["n4"], ["n2"]],
  //     },
  //     { id: "n2", type: "helper" },
  //     { id: "n3", type: "helper" },
  //     { id: "n4", type: "helper" },
  //   ];
  //   helper.load(lowestPrice, flow, function () {
  //     const n1 = helper.getNode("n1");
  //     const n2 = helper.getNode("n2");
  //     n2.on("input", function (msg) {
  //       result.current = msg.payload.current;
  //       expect(msg).to.have.deep.property("payload", result);
  //       n1.warn.should.not.be.called;
        done();
  //     });
  //     const time = DateTime.fromISO("2023-11-30T17:29:23.336+00:00");
  //     result.time = time.toISO();
  //     n1.receive({ payload: makePayload(input, time) });
  //   });
  });
});

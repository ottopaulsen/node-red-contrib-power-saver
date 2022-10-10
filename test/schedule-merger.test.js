const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("expect");
const helper = require("node-red-node-test-helper");
const scheduleMerger = require("../src/schedule-merger.js");
const prices = require("./data/converted-prices.json");
const result = require("./data/best-save-result.json");
const { testPlan: plan, equalPlan } = require("./test-utils");
const { version } = require("../package.json");
const { allOff, allOn, someOn } = require("./data/merge-schedule-data.js");

helper.init(require.resolve("node-red"));

describe("schedule-merger node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "ps-schedule-merger", name: "test name" }];
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).toHaveProperty("name", "test name");
      done();
    });
  });

  it("should show correct warnings", function (done) {
    const flow = [{ id: "n1", type: "ps-schedule-merger", name: "test name" }];
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      n1.receive({});
      n1.warn.should.be.calledWithExactly("Missing payload");
      n1.receive({ payload: "Error" });
      n1.warn.should.be.calledWithExactly("Missing hours");
      n1.receive({ payload: { hours: [] } });
      n1.warn.should.be.calledWithExactly("Empty hours");
      n1.receive({ payload: { hours: [{}] } });
      n1.warn.should.be.calledWithExactly("Missing strategyNodeId");
      done();
    });
  });

  it("sends a merged schedule on output 3", function (done) {
    const flow = makeFlow("OR");
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      n2.on("input", function (msg) {
        // expect(equalPlan(expected, msg.payload)).toBeTruthy();
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
    });
  });
});

function makeFlow(logicFunction) {
  return [
    {
      id: "n1",
      type: "ps-schedule-merger",
      name: "test name",
      logicFunction,
      sendCurrentValueWhenRescheduling: true,
      wires: [["n3"], ["n4"], ["n2"]],
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" },
    { id: "n4", type: "helper" },
  ];
}

function makePayload(strategyNodeId, hours) {
  const payload = {
    strategyNodeId,
    hours,
  };
  return payload;
}

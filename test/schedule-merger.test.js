const expect = require("expect");
const helper = require("node-red-node-test-helper");
const scheduleMerger = require("../src/schedule-merger.js");
const { testPlan: plan, equalPlan, equalHours } = require("./test-utils");
const { version } = require("../package.json");
const { allOff, allOn, someOn, theOtherOn } = require("./data/merge-schedule-data.js");

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

  // it("should show correct warnings", function (done) {
  //   const flow = [{ id: "n1", type: "ps-schedule-merger", name: "test name" }];
  //   helper.load(scheduleMerger, flow, function () {
  //     const n1 = helper.getNode("n1");
  //     n1.receive({ payload: { hours: [{}] } });
  //     n1.warn.should.be.calledWithExactly("Missing payload");
  //     n1.receive({ payload: "Error" });
  //     n1.warn.should.be.calledWithExactly("Missing hours");
  //     n1.receive({ payload: { hours: [] } });
  //     n1.warn.should.be.calledWithExactly("Empty hours");
  //     n1.receive({ payload: { hours: [{}] } });
  //     n1.warn.should.be.calledWithExactly("Missing strategyNodeId");
  //     done();
  //   });
  // });

  it("can merge two schedules with OR", function (done) {
    const flow = makeFlow("OR");
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalHours(someOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOff) });
    });
  });

  it("can merge two schedules with AND", function (done) {
    const flow = makeFlow("AND");
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalHours(someOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOn) });
    });
  });

  it("can merge two schedules with OR all on", function (done) {
    const flow = makeFlow("OR");
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalHours(allOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOn) });
    });
  });

  it("can merge two schedules with AND all off", function (done) {
    const flow = makeFlow("AND");
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalHours(allOff, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOff) });
    });
  });

  it("can merge three schedules with OR", function (done) {
    const flow = makeFlow("OR");
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalHours(allOn, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOff) });
      n1.receive({ payload: makePayload("s3", theOtherOn) });
    });
  });

  it("can merge three schedules with AND", function (done) {
    const flow = makeFlow("AND");
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalHours(allOff, msg.payload.hours, ["price", "onOff", "start"])).toBeTruthy();
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOn) });
      n1.receive({ payload: makePayload("s3", theOtherOn) });
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
      schedulingDelay: 10, // May need to increase on a slow computer
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

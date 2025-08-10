const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const scheduleMerger = require("../src/schedule-merger.js");
const { equalMinutes } = require("./test-utils");
const { allOff, allOn, someOn, theOtherOn } = require("./data/merge-schedule-data.js");
const { makeFlow, makePayload } = require("./schedule-merger-test-utils.js");

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
      expect(n1).to.have.property("name", "test name");
      done();
    });
  });

  it("can merge two schedules with OR", function (done) {
    const flow = makeFlow("OR");
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalMinutes(someOn, msg.payload.minutes, ["price", "onOff", "start"])).to.equal(true);
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOff) });
    });
  });

  it("can merge two schedules with AND", function (done) {
    const flow = makeFlow("AND", false);
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalMinutes(someOn, msg.payload.minutes, ["price", "onOff", "start"])).to.equal(true);
        expect(msg.payload.schedule.length).to.equal(6);
        expect(msg.payload.schedule[5].value).to.equal(false);
        expect(msg.payload.schedule[5].countMinutes).to.equal(null);
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
        expect(equalMinutes(allOn, msg.payload.minutes, ["price", "onOff", "start"])).to.equal(true);
        expect(msg.payload.schedule.length).to.equal(1);
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
        expect(equalMinutes(allOff, msg.payload.minutes, ["price", "onOff", "start"])).to.equal(true);
        expect(msg.payload.schedule.length).to.equal(2);
        expect(msg.payload.schedule[1].value).to.equal(true);
        expect(msg.payload.schedule[1].countMinutes).to.equal(null);
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
        expect(equalMinutes(allOn, msg.payload.minutes, ["price", "onOff", "start"])).to.equal(true);
        expect(msg.payload.schedule.length).to.equal(1);
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOff) });
      n1.receive({ payload: makePayload("s3", theOtherOn) });
    });
  });

  it("can merge three schedules with AND", function (done) {
    const flow = makeFlow("AND", false);
    helper.load(scheduleMerger, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalMinutes(allOff, msg.payload.minutes, ["price", "onOff", "start"])).to.equal(true);
        expect(msg.payload.schedule.length).to.equal(1);
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: makePayload("s1", someOn) });
      n1.receive({ payload: makePayload("s2", allOn) });
      n1.receive({ payload: makePayload("s3", theOtherOn) });
    });
  });
});

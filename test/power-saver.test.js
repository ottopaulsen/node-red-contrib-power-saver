const cloneDeep = require("lodash.clonedeep");
const expect = require("expect");
const helper = require("node-red-node-test-helper");
const powerSaver = require("../power-saver.js");
const { DateTime } = require("luxon");

const prices = require("./data/prices");
const plan = {
  schedule: [
    { time: "2021-06-20T01:50:00.000+02:00", value: true },
    { time: "2021-06-20T01:50:00.070+02:00", value: false },
    { time: "2021-06-20T01:50:00.080+02:00", value: true },
    { time: "2021-06-20T01:50:00.110+02:00", value: false },
    { time: "2021-06-20T01:50:00.120+02:00", value: true },
  ],
  time: "2021-06-20T01:50:00+02:00",
};

helper.init(require.resolve("node-red"));

describe("power-saver Node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "power-saver", name: "test name" }];
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).toHaveProperty("name", "test name");
      done();
    });
  });

  it("should log error when illegal data is received", function (done) {
    const flow = [{ id: "n1", type: "power-saver", name: "test name" }];
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      n1.receive({});
      n1.warn.should.be.calledWithExactly("Payload missing");
      n1.receive({ payload: "Error" });
      n1.warn.should.be.calledWithExactly("Payload must be an object");
      n1.receive({ payload: { today: [], tomorrow: [] } });
      n1.warn.should.be.calledWithExactly("Payload has no data");

      ["start", "value"].forEach((attr) => {
        const testData1 = {
          today: cloneDeep(prices.today),
          tomorrow: cloneDeep(prices.tomorrow),
        };
        delete testData1.today[3][attr];
        n1.receive({ payload: testData1 });
        n1.warn.should.be.calledWithExactly(
          "Malformed entries in payload.today. All entries must contain start and value."
        );
      });

      n1.receive({ payload: cloneDeep(prices) });
      n1.warn.should.not.be.called;
      done();
    });
  });
  it("should send new schedule on output 3", function (done) {
    const flow = [
      {
        id: "n1",
        type: "power-saver",
        name: "test name",
        wires: [["n3"], ["n4"], ["n2"]],
      },
      { id: "n2", type: "helper" },
      { id: "n3", type: "helper" },
      { id: "n4", type: "helper" },
    ];
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      n2.on("input", function (msg) {
        expect(msg.payload).toHaveProperty("schedule", plan.schedule);
        n1.warn.should.not.be.called;
        // done();
        setTimeout(() => {
          done();
        }, 500);
      });
      n3.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", true);
      });
      n4.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", false);
      });
      payload = cloneDeep(prices);
      payload.time = plan.time;
      let entryTime = DateTime.fromISO(payload.time);
      payload.today.forEach((e) => {
        e.start = entryTime.toISO();
        entryTime = entryTime.plus({ milliseconds: 10 });
        e.end = entryTime.toISO();
      });
      payload.tomorrow.forEach((e) => {
        e.start = entryTime.toISO();
        entryTime = entryTime.plus({ milliseconds: 10 });
        e.end = entryTime.toISO();
      });
      n1.receive({ payload });
    });
  });
});

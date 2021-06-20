const expect = require("expect");
const cloneDeep = require("lodash.clonedeep");

const helper = require("node-red-node-test-helper");
const powerSaver = require("../power-saver.js");

const prices = {
  raw_today: [
    {
      start: "2021-06-20T00:00:00+02:00",
      end: "2021-06-20T01:00:00+02:00",
      value: 0.3,
    },
    {
      start: "2021-06-20T01:00:00+02:00",
      end: "2021-06-20T02:00:00+02:00",
      value: 0.4,
    },
    {
      start: "2021-06-20T02:00:00+02:00",
      end: "2021-06-20T03:00:00+02:00",
      value: 0.8,
    },
    {
      start: "2021-06-20T03:00:00+02:00",
      end: "2021-06-20T04:00:00+02:00",
      value: 0.9,
    },
    {
      start: "2021-06-20T04:00:00+02:00",
      end: "2021-06-20T05:00:00+02:00",
      value: 0.7,
    },
    {
      start: "2021-06-20T05:00:00+02:00",
      end: "2021-06-20T06:00:00+02:00",
      value: 0.6,
    },
    {
      start: "2021-06-20T06:00:00+02:00",
      end: "2021-06-20T07:00:00+02:00",
      value: 0.5,
    },
    {
      start: "2021-06-20T07:00:00+02:00",
      end: "2021-06-20T08:00:00+02:00",
      value: 0.75,
    },
    {
      start: "2021-06-20T08:00:00+02:00",
      end: "2021-06-20T09:00:00+02:00",
      value: 0.2,
    },
    {
      start: "2021-06-20T09:00:00+02:00",
      end: "2021-06-21T00:00:00+02:00",
      value: 0.85,
    },
  ],
  raw_tomorrow: [
    {
      start: "2021-06-20T00:00:00+02:00",
      end: "2021-06-21T01:00:00+02:00",
      value: 0.3,
    },
    {
      start: "2021-06-21T01:00:00+02:00",
      end: "2021-06-21T02:00:00+02:00",
      value: 0.4,
    },
    {
      start: "2021-06-21T02:00:00+02:00",
      end: "2021-06-21T03:00:00+02:00",
      value: 0.8,
    },
    {
      start: "2021-06-21T03:00:00+02:00",
      end: "2021-06-21T04:00:00+02:00",
      value: 0.9,
    },
    {
      start: "2021-06-21T04:00:00+02:00",
      end: "2021-06-21T05:00:00+02:00",
      value: 0.7,
    },
    {
      start: "2021-06-21T05:00:00+02:00",
      end: "2021-06-21T06:00:00+02:00",
      value: 0.6,
    },
    {
      start: "2021-06-21T06:00:00+02:00",
      end: "2021-06-21T07:00:00+02:00",
      value: 0.5,
    },
    {
      start: "2021-06-21T07:00:00+02:00",
      end: "2021-06-21T08:00:00+02:00",
      value: 0.75,
    },
    {
      start: "2021-06-21T08:00:00+02:00",
      end: "2021-06-21T09:00:00+02:00",
      value: 0.2,
    },
    {
      start: "2021-06-21T09:00:00+02:00",
      end: "2021-06-22T00:00:00+02:00",
      value: 0.85,
    },
  ],
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
      n1.receive({ payload: {} });
      n1.warn.should.be.calledWithExactly("Payload is missing raw_today array");
      n1.receive({ payload: { raw_today: [] } });
      n1.warn.should.be.calledWithExactly(
        "Payload is missing raw_tomorrow array"
      );
      n1.receive({ payload: { raw_today: [], raw_tomorrow: [] } });
      n1.warn.should.be.calledWithExactly("Payload has no data");

      ["start", "end", "value"].forEach((attr) => {
        const testData1 = {
          raw_today: cloneDeep(prices.raw_today),
          raw_tomorrow: cloneDeep(prices.raw_tomorrow),
        };
        delete testData1.raw_today[3][attr];
        n1.receive({ payload: testData1 });
        n1.warn.should.be.calledWithExactly(
          "Malformed entries in payload.raw_today. All entries must contain start, end and value."
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
        wires: [[], [], ["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(powerSaver, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", {
          schedule: {
            today: [],
            tomorrow: [],
          },
        });
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: cloneDeep(prices) });
    });
  });
});

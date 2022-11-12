const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("expect");
const helper = require("node-red-node-test-helper");
const fixedSchedule = require("../src/strategy-fixed-schedule.js");
const prices = require("./data/converted-prices.json");
const result = require("./data/fixed-schedule-result.json");
const { testPlan: plan, equalPlan } = require("./test-utils");

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

  it("should send schedule on output 3", function (done) {
    const flow = makeFlow();
    const expected = cloneDeep(result);
    helper.load(fixedSchedule, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      let countOn = 0;
      let countOff = 0;
      n2.on("input", function (msg) {
        expect(equalPlan(expected, msg.payload)).toBeTruthy();
        n1.warn.should.not.be.called;
        setTimeout(() => {
          console.log("countOn = " + countOn + ", countOff = " + countOff);
          expect(countOn).toEqual(0);
          expect(countOff).toEqual(1);
          done();
        }, 90);
      });
      n3.on("input", function (msg) {
        countOn++;
        expect(msg).toHaveProperty("payload", true);
      });
      n4.on("input", function (msg) {
        countOff++;
        expect(msg).toHaveProperty("payload", false);
      });
      n1.receive({ payload: prices, time: prices.priceData[0].start });
    });
  });
});

function makePayload(prices, time) {
  const payload = cloneDeep(prices);
  payload.time = time;
  let entryTime = DateTime.fromISO(payload.time);
  payload.priceData.forEach((e) => {
    e.start = entryTime.toISO();
    entryTime = entryTime.plus({ milliseconds: 10 });
  });
  return payload;
}

function makeFlow() {
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
      // validFrom: null,
      // validTo: null,
      wires: [["n3"], ["n4"], ["n2"]],
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" },
    { id: "n4", type: "helper" },
  ];
}

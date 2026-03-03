"use strict";

const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const priceFilter = require("../src/price-filter.js");

helper.init(require.resolve("node-red"));

// Five hourly entries starting at 2021-06-20T00:00:00+02:00
const BASE_MINUTES = [
  { start: "2021-06-20T00:00:00.000+02:00", onOff: true,  price: 0.20, saving: null },
  { start: "2021-06-20T01:00:00.000+02:00", onOff: true,  price: 0.35, saving: null },
  { start: "2021-06-20T02:00:00.000+02:00", onOff: false, price: 0.40, saving: null },
  { start: "2021-06-20T03:00:00.000+02:00", onOff: true,  price: 0.25, saving: null },
  { start: "2021-06-20T04:00:00.000+02:00", onOff: true,  price: 0.30, saving: null },
];

const BASE_CONFIG = {
  outputValueForOn: true,
  outputValueForOff: false,
  outputIfNoSchedule: true,
  override: "auto",
  sendCurrentValueWhenRescheduling: true,
};

function makePayload(minutes, overrideConfig = {}) {
  return {
    schedule: [{ time: minutes[0].start, value: minutes[0].onOff, countMinutes: 300 }],
    minutes,
    source: "Test Strategy",
    config: { ...BASE_CONFIG, ...overrideConfig },
    time: minutes[0].start,
    version: "5.0.0",
    strategyNodeId: "test-upstream",
  };
}

function makeFlow(turn, condition, limit) {
  return [
    {
      id: "n1",
      type: "ps-price-filter",
      name: "test filter",
      turn,
      condition,
      limit,
      wires: [["n2"], ["n3"], ["n4"]],
    },
    { id: "n2", type: "helper" }, // output 1: on
    { id: "n3", type: "helper" }, // output 2: off
    { id: "n4", type: "helper" }, // output 3: schedule
  ];
}

describe("ps-price-filter node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "ps-price-filter", name: "test filter", turn: "off", condition: "over", limit: 0.3 }];
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).to.have.property("name", "test filter");
      done();
    });
  });

  it("should force off minutes with price over limit", function (done) {
    // turn=off, condition=over, limit=0.30 → minutes with price > 0.30 become off
    // prices: 0.20(on), 0.35(on→off), 0.40(off), 0.25(on), 0.30(on, not strictly over)
    const flow = makeFlow("off", "over", 0.30);
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");
      n4.on("input", function (msg) {
        const minutes = msg.payload.minutes;
        expect(minutes[0].onOff).to.equal(true,  "0.20 should stay on");
        expect(minutes[1].onOff).to.equal(false, "0.35 should be forced off");
        expect(minutes[2].onOff).to.equal(false, "0.40 should be forced off (was already off)");
        expect(minutes[3].onOff).to.equal(true,  "0.25 should stay on");
        expect(minutes[4].onOff).to.equal(true,  "0.30 (= limit, not over) should stay on");
        done();
      });
      n1.receive({ payload: makePayload(BASE_MINUTES) });
    });
  });

  it("should force on minutes with price under limit", function (done) {
    // turn=on, condition=under, limit=0.30 → minutes with price < 0.30 become on
    // prices: 0.20(on), 0.35(on), 0.40(off), 0.25(on), 0.30(on, not strictly under)
    const flow = makeFlow("on", "under", 0.30);
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");
      n4.on("input", function (msg) {
        const minutes = msg.payload.minutes;
        expect(minutes[0].onOff).to.equal(true,  "0.20 < 0.30 → forced on (was already on)");
        expect(minutes[1].onOff).to.equal(true,  "0.35 not under 0.30 → unchanged (on)");
        expect(minutes[2].onOff).to.equal(false, "0.40 not under 0.30 → unchanged (off)");
        expect(minutes[3].onOff).to.equal(true,  "0.25 < 0.30 → forced on (was already on)");
        expect(minutes[4].onOff).to.equal(true,  "0.30 == limit (not strictly under) → unchanged (on)");
        done();
      });
      n1.receive({ payload: makePayload(BASE_MINUTES) });
    });
  });

  it("should not change minutes with price exactly at limit", function (done) {
    // Strictly > and < so exactly equal to limit must not be changed
    const flow = makeFlow("off", "over", 0.30);
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");
      n4.on("input", function (msg) {
        // minute index 4 has price exactly 0.30 and onOff=true → should remain true
        expect(msg.payload.minutes[4].onOff).to.equal(true, "price == limit should not be changed");
        done();
      });
      n1.receive({ payload: makePayload(BASE_MINUTES) });
    });
  });

  it("should not change minutes with null price", function (done) {
    const minutesWithNull = [
      { start: "2021-06-20T00:00:00.000+02:00", onOff: true,  price: null,  saving: null },
      { start: "2021-06-20T01:00:00.000+02:00", onOff: false, price: null,  saving: null },
      { start: "2021-06-20T02:00:00.000+02:00", onOff: true,  price: 0.40, saving: null },
    ];
    const flow = makeFlow("off", "over", 0.10); // limit so low everything with a price would be forced off
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");
      n4.on("input", function (msg) {
        expect(msg.payload.minutes[0].onOff).to.equal(true,  "null price stays unchanged");
        expect(msg.payload.minutes[1].onOff).to.equal(false, "null price stays unchanged");
        expect(msg.payload.minutes[2].onOff).to.equal(false, "0.40 > 0.10 forced off");
        done();
      });
      n1.receive({ payload: makePayload(minutesWithNull) });
    });
  });

  it("should add filter fields to output config", function (done) {
    const flow = makeFlow("on", "under", 0.5);
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");
      n4.on("input", function (msg) {
        expect(msg.payload.config).to.include({ turn: "on", condition: "under", limit: 0.5 });
        // Upstream config fields are also forwarded
        expect(msg.payload.config).to.include({ outputValueForOn: true, outputValueForOff: false });
        done();
      });
      n1.receive({ payload: makePayload(BASE_MINUTES) });
    });
  });

  it("should set source to node name on output 3", function (done) {
    const flow = makeFlow("off", "over", 1.0);
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");
      n4.on("input", function (msg) {
        expect(msg.payload.source).to.equal("test filter");
        done();
      });
      n1.receive({ payload: makePayload(BASE_MINUTES) });
    });
  });

  it("should send on output 1 when current minute is on", function (done) {
    // All prices are below any high limit → nothing forced, first minute is on
    const flow = makeFlow("off", "over", 9999);
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2"); // output 1: on
      n2.on("input", function (msg) {
        expect(msg.payload).to.equal(true);
        done();
      });
      n1.receive({ payload: makePayload(BASE_MINUTES) });
    });
  });

  it("should send on output 2 when current minute is off", function (done) {
    // Force all minutes off by using a very low limit
    const flow = makeFlow("off", "over", 0.0);
    const minutesAllAboveZero = BASE_MINUTES.map((m) => ({ ...m }));
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n3 = helper.getNode("n3"); // output 2: off
      n3.on("input", function (msg) {
        expect(msg.payload).to.equal(false);
        done();
      });
      n1.receive({ payload: makePayload(minutesAllAboveZero) });
    });
  });

  it("should produce a correct schedule with change events only", function (done) {
    // turn=off, condition=over, limit=0.30
    // Minutes: true(0.20), true→false(0.35), false(0.40), true(0.25), true(0.30)
    // Expected schedule changes: H0=on, H1=off, H3=on
    const flow = makeFlow("off", "over", 0.30);
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");
      n4.on("input", function (msg) {
        const schedule = msg.payload.schedule;
        expect(schedule.length).to.be.at.least(3);
        expect(schedule[0].value).to.equal(true);
        expect(schedule[1].value).to.equal(false);
        expect(schedule[2].value).to.equal(true);
        done();
      });
      n1.receive({ payload: makePayload(BASE_MINUTES) });
    });
  });

  it("should ignore messages without a minutes array", function (done) {
    const flow = makeFlow("off", "over", 0.30);
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");
      let received = false;
      n4.on("input", function () { received = true; });
      n1.receive({ payload: { priceData: [], source: "not a schedule" } });
      setTimeout(() => {
        expect(received).to.equal(false, "should not send output when no minutes array");
        done();
      }, 100);
    });
  });

  it("should not mutate the incoming message payload", function (done) {
    const flow = makeFlow("off", "over", 0.30);
    helper.load(priceFilter, flow, function () {
      const n1 = helper.getNode("n1");
      const n4 = helper.getNode("n4");
      const originalPayload = makePayload(BASE_MINUTES);
      const originalOnOff1 = originalPayload.minutes[1].onOff; // true, will be forced off by filter
      n4.on("input", function () {
        expect(originalPayload.minutes[1].onOff).to.equal(
          originalOnOff1,
          "original msg.payload.minutes should not be mutated"
        );
        done();
      });
      n1.receive({ payload: originalPayload });
    });
  });
});

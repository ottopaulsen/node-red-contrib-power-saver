const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("expect");
const helper = require("node-red-node-test-helper");
const bestSave = require("../src/strategy-best-save.js");
const prices = require("./data/converted-prices.json");
const result = require("./data/best-save-result.json");
const { testPlan: plan, equalPlan } = require("./test-utils");
const { makeFlow } = require("./strategy-best-save-test-utils");
const { version } = require("../package.json");

helper.init(require.resolve("node-red"));

describe("ps-strategy-best-save node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "ps-strategy-best-save", name: "test name" }];
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).toHaveProperty("name", "test name");
      done();
    });
  });

  it("should log error when illegal data is received", function (done) {
    const flow = [{ id: "n1", type: "ps-strategy-best-save", name: "test name" }];
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      n1.receive({});
      n1.warn.should.be.calledWithExactly("No payload");
      n1.receive({ payload: "Error" });
      n1.warn.should.be.calledWithExactly("Payload is not an object");
      n1.receive({ payload: [] });
      n1.warn.should.be.calledWithExactly("Payload is missing priceData");
      n1.receive({ payload: { priceData: [] } });
      n1.warn.should.be.calledWithExactly("priceData is empty");
      n1.receive({ payload: { priceData: { today: [], tomorrow: [] } } });
      n1.warn.should.be.calledWithExactly("Illegal priceData in payload. Did you use the receive-price node?");

      ["start", "value"].forEach((attr) => {
        const testData1 = cloneDeep(prices);
        delete testData1.priceData[3][attr];
        n1.receive({ payload: testData1 });
        n1.warn.should.be.calledWithExactly(
          "Malformed entries in priceData. All entries must contain start and value."
        );
      });

      n1.receive({ payload: cloneDeep(prices) });
      n1.warn.should.not.be.called;
      done();
    });
  });
  it("should send new schedule on output 3", function (done) {
    const flow = makeFlow(3, 2);
    const expected = cloneDeep(result);
    expected.version = version;
    expected.time = plan.time;
    expected.source = "Tibber";
    expected.current = false;
    helper.load(bestSave, flow, function () {
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
          expect(countOn).toEqual(7);
          expect(countOff).toEqual(7);
          done();
        }, 900);
      });
      n3.on("input", function (msg) {
        countOn++;
        expect(msg).toHaveProperty("payload", true);
      });
      n4.on("input", function (msg) {
        countOff++;
        expect(msg).toHaveProperty("payload", false);
      });
      n1.receive({ payload: makePayload(prices, plan.time) });
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

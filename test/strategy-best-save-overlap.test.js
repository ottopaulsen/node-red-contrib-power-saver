const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const bestSave = require("../src/strategy-best-save.js");
const prices = require("./data/best-save-overlap-prices.json");
const result = require("./data/best-save-overlap-result.json");
const { testPlan: plan, equalPlan } = require("./test-utils");
const { makeFlow } = require("./strategy-best-save-test-utils");
const { version } = require("../package.json");

helper.init(require.resolve("node-red"));

describe("ps-strategy-best-save overlapping savings", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it.skip("should find the best prices when overlapping savings", function (done) {
    const flow = makeFlow(12, 1, true);
    flow[0].minSaving = 0.01;
    const expected = cloneDeep(result);
    expected.version = version;
    expected.time = plan.time;
    expected.source = "Tibber";
    expected.current = false;
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(equalPlan(expected, msg.payload)).to.equal(true);
        n1.warn.should.not.be.called;
        setTimeout(() => {
          done();
        }, 900);
      });
      n1.receive({ payload: makePayload(prices, "2022-08-16T17:14:35.673+02:00") });
    });
  });
});

function makePayload(prices, time) {
  const payload = cloneDeep(prices);
  payload.time = time;
  return payload;
}

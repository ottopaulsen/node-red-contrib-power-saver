const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const bestSave = require("../src/strategy-best-save.js");
const input = require("./data/bug-232-input.json");
const output = require("./data/bug-232-output.json");
const { testPlan: plan, equalPlan } = require("./test-utils");
const { makeFlow } = require("./strategy-best-save-test-utils");
const { version } = require("../package.json");

helper.init(require.resolve("node-red"));

describe("ps-strategy-best-save bug-232", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it.skip("find bug", function (done) {
    const flow = makeFlow(output.config.maxMinutesOff, output.config.minMinutesOff, output.config.recoveryPercentage  , output.config.recoveryMaxMinutes);
    flow[0].minSaving = output.config.minSaving;
    flow[0].outputIfNoSchedule = output.config.outputIfNoSchedule;
    const expected = cloneDeep(output);
    expected.version = output.version;
    expected.time = output.time;
    expected.source = output.source;
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
      n1.receive({ payload: makePayload()})
    });
  });
});

function makePayload() {
  const payload = cloneDeep(input);
  payload.time = output.time;
  return payload;
}

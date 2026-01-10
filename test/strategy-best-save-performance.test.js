const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const bestSave = require("../src/strategy-best-save.js");
const payload = require("./data/best-save-performance-price-data.js");

const { testPlan: plan, equalPlan } = require("./test-utils.js");
const { makeFlow } = require("./strategy-best-save-test-utils.js");

helper.init(require.resolve("node-red"));

describe("ps-strategy-best-save performance", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("short intervals should be quick", function (done) {
    this.timeout(500);
    const maxMinutesOff = 6
    const minMinutesOff = 6
    const recoveryPercentage = 20
    const recoveryMaxMinutes = 180
    const flow = makeFlow(maxMinutesOff, minMinutesOff, recoveryPercentage, recoveryMaxMinutes);
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload });
    });
  });

  it("medium intervals should be quick enough", function (done) {
    this.timeout(4000);
    const maxMinutesOff = 300
    const minMinutesOff = 60
    const recoveryPercentage = 20
    const recoveryMaxMinutes = 180
    const flow = makeFlow(maxMinutesOff, minMinutesOff, recoveryPercentage, recoveryMaxMinutes);
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload });
    });
  });

  it("long intervals should be fairly quick", function (done) {
    this.timeout(10000);
    const maxMinutesOff = 840
    const minMinutesOff = 60
    const recoveryPercentage = 20
    const recoveryMaxMinutes = 180
    const flow = makeFlow(maxMinutesOff, minMinutesOff, recoveryPercentage, recoveryMaxMinutes);
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload });
    });
  });


});

const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const bestSave = require("../src/strategy-best-save.js");
const prices = require("./data/v5-best-save-prices-1.json");
const result = require("./data/v5-best-save-result-1.js");
const convertedPrices = require("./data/converted-prices.json");
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
      expect(n1).to.have.property("name", "test name");
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
    const flow = makeFlow();
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
      n2.on("input", function (msg) {
        expect(equalPlan(expected, msg.payload)).to.equal(true);
        n1.warn.should.not.be.called;
        done();
      });
      n1.receive({ payload: prices });
    });
  });

  it.skip("should not send output when rescheduling", function (done) {
    const flow = makeFlow();
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      let countOn = 0;
      let countOff = 0;
      let pass = 0;
      n2.on("input", function (msg) {
        pass++;
        switch (pass) {
          case 1:
            const payload = {
              ...convertedPrices,
              time: "2021-10-11T01:11:00.000+02:00",
            };
            n1.receive({ payload });
            break;
          case 2:
            setTimeout(() => {
              console.log("countOn = " + countOn + ", countOff = " + countOff);
              expect(countOn).to.equal(0);
              expect(countOff).to.equal(1);
              done();
            }, 100);
        }
      });
      n3.on("input", function (msg) {
        countOn++;
        expect(msg).to.have.deep.property("payload", true);
      });
      n4.on("input", function (msg) {
        countOff++;
        expect(msg).to.have.deep.property("payload", false);
      });
      const payload = {
        ...convertedPrices,
        time: "2021-10-11T01:10:00.000+02:00",
      };
      n1.receive({ payload });
    });
  });

  it("should handle override", function (done) {
    const flow = makeFlow();
    const expected = cloneDeep(result);
    expected.version = version;
    expected.time = plan.time;
    expected.source = "Tibber";
    expected.current = false;
    let timeoutSet = false;
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      let countOn = 0;
      let countOff = 0;
      n2.on("input", function (msg) {
        expect(equalPlan(expected, msg.payload)).to.equal(true);
        n1.warn.should.not.be.called;
        if (!timeoutSet) {
          timeoutSet = true;
          // setTimeout(() => {
          //   console.log("countOn = " + countOn + ", countOff = " + countOff);
          //   expect(countOn).to.equal(2);
          //   expect(countOff).to.equal(2);
          //   done();
          // }, 900);
        }
        done()
      });
      n3.on("input", function (msg) {
        countOn++;
        expect(msg).to.have.deep.property("payload", true);
      });
      n4.on("input", function (msg) {
        countOff++;
        expect(msg).to.have.deep.property("payload", false);
        if (countOff === 2) {
          n1.receive({ payload: { config: { override: "on" }, time: plan.time } });
        }
      });
      n1.receive({ payload: makePayload(prices, plan.time) });
    });
  });
  it("should send number as output", function (done) {
    const flow = makeFlow();
    flow[0].outputValueForOn = "1";
    flow[0].outputValueForOff = "0";
    flow[0].outputValueForOntype = "num";
    flow[0].outputValueForOfftype = "num";
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      n2.on("input", function (msg) {
        expect(msg.payload.config.outputValueForOn).to.equal(1);
        expect(msg.payload.config.outputValueForOff).to.equal(0);
        expect(msg.payload.config.outputValueForOntype).to.equal("num");
        expect(msg.payload.config.outputValueForOfftype).to.equal("num");
        n1.warn.should.not.be.called;
        setTimeout(() => {
          done();
        }, 100);
      });
      n3.on("input", function (msg) {
        expect(msg).to.have.deep.property("payload", 1);
      });
      n4.on("input", function (msg) {
        expect(msg).to.have.deep.property("payload", 0);
      });
      n1.receive({ payload: makePayload(prices, plan.time) });
    });
  });
  it("should send text as output", function (done) {
    const flow = makeFlow();
    flow[0].outputValueForOn = "on";
    flow[0].outputValueForOff = "off";
    flow[0].outputValueForOntype = "str";
    flow[0].outputValueForOfftype = "str";
    helper.load(bestSave, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      const n3 = helper.getNode("n3");
      const n4 = helper.getNode("n4");
      n2.on("input", function (msg) {
        expect(msg.payload.config.outputValueForOn).to.equal("on");
        expect(msg.payload.config.outputValueForOff).to.equal("off");
        expect(msg.payload.config.outputValueForOntype).to.equal("str");
        expect(msg.payload.config.outputValueForOfftype).to.equal("str");
        n1.warn.should.not.be.called;
        setTimeout(() => {
          done();
        }, 100);
      });
      n3.on("input", function (msg) {
        expect(msg).to.have.deep.property("payload", "on");
      });
      n4.on("input", function (msg) {
        expect(msg).to.have.deep.property("payload", "off");
      });
      n1.receive({ payload: makePayload(prices, plan.time) });
    });
  });
});

function makePayload(prices, time) {
  const payload = cloneDeep(prices);
  // payload.time = time;
  // let entryTime = DateTime.fromISO(payload.time);
  // payload.priceData.forEach((e) => {
  //   e.start = entryTime.toISO();
  //   // entryTime = entryTime.plus({ milliseconds: 10 });
  //   entryTime = entryTime.plus({ hours: 1 });
  // });
  return payload;
}

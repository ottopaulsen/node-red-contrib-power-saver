const helper = require("node-red-node-test-helper");
const receivePrices = require("../src/receive-price.js");
const expect = require("expect");

helper.init(require.resolve("node-red"));

describe("receive-price node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "ps-receive-price", name: "test name" }];
    helper.load(receivePrices, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).toHaveProperty("name", "test name");
      done();
    });
  });

  it("should convert tibber prices", function (done) {
    const tibberPrices = require("./data/tibber-prices.json");
    const convertedPrices = require("./data/converted-prices.json");
    convertedPrices.priceData.source = "Tibber";
    const flow = [
      {
        id: "n1",
        type: "ps-receive-price",
        name: "Receive prices",
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(receivePrices, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", convertedPrices);
        done();
      });
      n1.receive(tibberPrices);
    });
  });

  it("should convert tibber single home prices", function (done) {
    const tibberPrices = require("./data/tibber-prices-single-home.json");
    const convertedPrices = require("./data/converted-prices.json");
    convertedPrices.priceData.source = "Tibber";
    const flow = [
      {
        id: "n1",
        type: "ps-receive-price",
        name: "Receive prices",
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(receivePrices, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", convertedPrices);
        done();
      });
      n1.receive(tibberPrices);
    });
  });

  it("should convert nordpool event prices", function (done) {
    const nordpoolPrices = require("./data/nordpool-event-prices.json");
    const convertedPrices = require("./data/converted-prices.json");
    convertedPrices.priceData.source = "Nordpool";
    const flow = [
      {
        id: "n1",
        type: "ps-receive-price",
        name: "Receive prices",
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(receivePrices, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", convertedPrices);
        done();
      });
      n1.receive(nordpoolPrices);
    });
  });

  it("should convert nordpool current state prices", function (done) {
    const nordpoolPrices = require("./data/nordpool-current-state-prices.json");
    const convertedPrices = require("./data/converted-prices.json");
    convertedPrices.priceData.source = "Nordpool";
    const flow = [
      {
        id: "n1",
        type: "ps-receive-price",
        name: "Receive prices",
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(receivePrices, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).toHaveProperty("payload", convertedPrices);
        done();
      });
      n1.receive({ payload: nordpoolPrices });
    });
  });
});

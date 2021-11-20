const helper = require("node-red-node-test-helper");
const elviaAddTariff = require("../elvia/elvia-add-tariff.js");
const expect = require("expect");

helper.init(require.resolve("node-red"));

describe("ps-elvia-add-tariff node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "ps-elvia-add-tariff", name: "test name" }];
    helper.load(elviaAddTariff, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).toHaveProperty("name", "test name");
      done();
    });
  });

  // it("should add grid tariff to power prices", function (done) {
  //   const powerPriceInput = require("./data/elvia-input-power-prices.json");
  //   const gridTariffInput = require("./data/elvia-input-grid-tariff.json");
  //   const output = require("./data/elvia-output-add-tariff.json");
  //   const flow = [
  //     {
  //       id: "n1",
  //       type: "ps-elvia-add-tariff",
  //       name: "Add Elvia Tariff",
  //       wires: ["n2"],
  //     },
  //     { id: "n2", type: "helper" },
  //   ];
  //   helper.load(elviaAddTariff, flow, function () {
  //     const n1 = helper.getNode("n1");
  //     const n2 = helper.getNode("n2");
  //     n2.on("input", function (msg) {
  //       expect(msg).toHaveProperty("payload", output);
  //       done();
  //     });
  //     n1.getTariffForPeriod = () => {
  //       console.log("He he");
  //     };
  //     n1.receive({ payload: powerPriceInput });
  //   });
  // });
});

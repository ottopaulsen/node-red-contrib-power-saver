const helper = require("node-red-node-test-helper");
const elviaAddTariff = require("../src/elvia/elvia-add-tariff.js");
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
});

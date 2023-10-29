const helper = require("node-red-node-test-helper");
const elviaAddTariff = require("../src/elvia/elvia-add-tariff.js");
const elviaConfig = require("../src/elvia/elvia-config.js");
const expect = require("chai").expect;

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
    const flow = [
      // elviaConfig.credentials.elviaSubscriptionKey
      {
        id: "n1",
        type: "ps-elvia-add-tariff",
        name: "test name",
        elviaConfig: "n2",
      },
      {
        id: "n2",
        type: "ps-elvia-config",
        name: "test name",
      },
    ];
    helper.load([elviaAddTariff, elviaConfig], flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).to.have.property("name", "test name");
      done();
    });
  });
});

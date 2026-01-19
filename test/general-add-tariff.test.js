const helper = require("node-red-node-test-helper");
const addTariff = require("../src/general-add-tariff.js");
const expect = require("chai").expect;
const cloneDeep = require("lodash.clonedeep");

const prices = {
  source: "Test",
  priceData: [
    {
      value: 0.2,
      start: "2021-10-11T00:00:00.000+02:00",
    },
    {
      value: 0.3,
      start: "2021-10-11T01:00:00.000+02:00",
    },
    {
      value: 0.1,
      start: "2021-10-11T02:00:00.000+02:00",
    },
    {
      value: 1.2345,
      start: "2021-10-11T03:00:00.000+02:00",
    },
    {
      value: 2.1,
      start: "2021-10-12T00:00:00.000+02:00", // Tuesday
    },
    {
      value: 2.2,
      start: "2021-10-12T01:00:00.000+02:00",
      end: "2021-10-13T00:00:00.000+02:00",
    },
  ],
};

helper.init(require.resolve("node-red"));

describe("general-add-tariff node", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "ps-general-add-tariff", name: "test name" }];
    helper.load(addTariff, flow, function () {
      const n1 = helper.getNode("n1");
      expect(n1).to.have.property("name", "test name");
      done();
    });
  });

  it("should add to price and config", function (done) {
    const flow = [
      {
        id: "n1",
        type: "ps-general-add-tariff",
        name: "Add tariff",
        wires: [["n2"]],
        periods: [
          { start: "01", value: "0.50" },
          { start: "03", value: "0.80" },
        ],
        days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
      },
      { id: "n2", type: "helper" },
    ];
    const result = cloneDeep(prices);
    result.priceData[0].value = 1.0;
    result.priceData[1].value = 0.8;
    result.priceData[2].value = 0.6;
    result.priceData[3].value = 2.0345;
    result.priceData[4].value = 2.9;
    result.priceData[5].value = 2.7;
    result.priceData.push({
      start: "2021-10-12T03:00:00.000+02:00",
      value: 3.0,
    });
    result.priceData[6].end = result.priceData[5].end;
    delete result.priceData[5].end;
    result.config = { abc: 123 };
    helper.load(addTariff, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).to.have.deep.property("payload", result);
        done();
      });
      const payload = cloneDeep(prices);
      payload.config = { abc: 123 };
      n1.receive({ payload });
    });
  });
  it("should add to price only for correct days", function (done) {
    const flow = [
      {
        id: "n1",
        type: "ps-general-add-tariff",
        name: "Add tariff",
        wires: [["n2"]],
        periods: [
          { start: "01", value: "0.50" },
          { start: "03", value: "0.80" },
        ],
        days: { Mon: true, Tue: false, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
      },
      { id: "n2", type: "helper" },
    ];
    const result = cloneDeep(prices);
    result.priceData[0].value = 1.0;
    result.priceData[1].value = 0.8;
    result.priceData[2].value = 0.6;
    result.priceData[3].value = 2.0345;
    result.priceData[4].value = 2.1;
    result.priceData[5].value = 2.2;
    result.priceData.push({
      start: "2021-10-12T03:00:00.000+02:00",
      value: 2.2,
    });
    result.priceData[6].end = result.priceData[5].end;
    delete result.priceData[5].end;
    result.config = { abc: 123 };
    helper.load(addTariff, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).to.have.deep.property("payload", result);
        done();
      });
      const payload = cloneDeep(prices);
      payload.config = { abc: 123 };
      n1.receive({ payload });
    });
  });
  it("should add to price when only first day is valid", function (done) {
    const flow = [
      {
        id: "n1",
        type: "ps-general-add-tariff",
        name: "Add tariff",
        wires: [["n2"]],
        periods: [
          { start: "01", value: "0.50" },
          { start: "03", value: "0.80" },
        ],
        days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
        validFrom: "2021-10-11",
        validTo: "2021-10-11",
      },
      { id: "n2", type: "helper" },
    ];
    const result = cloneDeep(prices);
    console.log(JSON.stringify(result, null, 2));
    result.priceData[0].value = 1.0;
    result.priceData[1].value = 0.8;
    result.priceData[2].value = 0.6;
    result.priceData[3].value = 2.0345;
    result.priceData[4].value = 2.1;
    result.priceData[5].value = 2.2;
    result.priceData.push({
      start: "2021-10-12T03:00:00.000+02:00",
      value: 2.2,
    });
    result.priceData[6].end = result.priceData[5].end;
    delete result.priceData[5].end;
    helper.load(addTariff, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).to.have.deep.property("payload", result);
        done();
      });
      n1.receive({ payload: prices });
    });
  });
  it("should add to price when only last day is valid", function (done) {
    const flow = [
      {
        id: "n1",
        type: "ps-general-add-tariff",
        name: "Add tariff",
        wires: [["n2"]],
        periods: [
          { start: "01", value: "0.50" },
          { start: "03", value: "0.80" },
        ],
        days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
        validFrom: "2021-10-12",
      },
      { id: "n2", type: "helper" },
    ];
    const result = cloneDeep(prices);
    result.priceData[0].value = 0.2;
    result.priceData[1].value = 0.3;
    result.priceData[2].value = 0.1;
    result.priceData[3].value = 1.2345;
    result.priceData[4].value = 2.9;
    result.priceData[5].value = 2.7;
    result.priceData.push({
      start: "2021-10-12T03:00:00.000+02:00",
      value: 3.0,
    });
    result.priceData[6].end = result.priceData[5].end;
    delete result.priceData[5].end;
    helper.load(addTariff, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).to.have.deep.property("payload", result);
        done();
      });
      n1.receive({ payload: prices });
    });
  });
  it("should add to price when only one period", function (done) {
    const flow = [
      {
        id: "n1",
        type: "ps-general-add-tariff",
        name: "Add tariff",
        wires: [["n2"]],
        periods: [{ start: "01", value: "0.50" }],
        days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
      },
      { id: "n2", type: "helper" },
    ];
    const result = cloneDeep(prices);
    result.priceData[0].value = 0.7;
    result.priceData[1].value = 0.8;
    result.priceData[2].value = 0.6;
    result.priceData[3].value = 1.7345;
    result.priceData[4].value = 2.6;
    result.priceData[5].value = 2.7;
    helper.load(addTariff, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).to.have.deep.property("payload", result);
        done();
      });
      n1.receive({ payload: prices });
    });
  });
  it("should add to fixed price for 2 days", function (done) {
    const singlePrice = {
      priceData: [{ value: 0.5, start: "2026-01-12T00:00:00.000+01:00", end: "2026-01-14T00:00:00.000+01:00" }],
      source: "Norgespris",
    };

    const flow = [
      {
        id: "n1",
        type: "ps-general-add-tariff",
        name: "Add tariff",
        wires: [["n2"]],
        periods: [
          { start: "22", value: "0.307" },
          { start: "06", value: "0.403" },
        ],
        days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
      },
      { id: "n2", type: "helper" },
    ];
    const result = cloneDeep(singlePrice);
    result.priceData = [
      { value: 0.807, start: "2026-01-12T00:00:00.000+01:00" },
      { value: 0.903, start: "2026-01-12T06:00:00.000+01:00" },
      { value: 0.807, start: "2026-01-12T22:00:00.000+01:00" },
      { value: 0.903, start: "2026-01-13T06:00:00.000+01:00" },
      { value: 0.807, start: "2026-01-13T22:00:00.000+01:00", end: "2026-01-14T00:00:00.000+01:00" },
    ];
    helper.load(addTariff, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      n2.on("input", function (msg) {
        expect(msg).to.have.deep.property("payload", result);
        done();
      });
      n1.receive({ payload: singlePrice });
    });
  });
});

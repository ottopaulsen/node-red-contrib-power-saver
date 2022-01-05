const expect = require("expect");
const { DateTime } = require("luxon");
const { addTariffToPrices, buildAllHours } = require("../src/general-add-tariff-functions");

describe("general-add-tariff-functions", () => {
  it("can build all hours 6-22", () => {
    const periods = [
      { start: "06", value: 10 },
      { start: "22", value: 11 },
    ];
    const result = [];
    fillResult(result, 0, 5, 11);
    fillResult(result, 6, 21, 10);
    fillResult(result, 22, 23, 11);

    expect(buildAllHours(console, periods)).toEqual(result);
  });
  it("can build all hours 0-22", () => {
    const periods = [
      { start: "00", value: 10 },
      { start: "22", value: 11 },
    ];
    const result = [];
    fillResult(result, 0, 21, 10);
    fillResult(result, 22, 23, 11);

    expect(buildAllHours(console, periods)).toEqual(result);
  });
  it("can build all hours 22-23", () => {
    const periods = [
      { start: "00", value: 10 },
      { start: "23", value: 11 },
    ];
    const result = [];
    fillResult(result, 0, 22, 10);
    fillResult(result, 23, 23, 11);

    expect(buildAllHours(console, periods)).toEqual(result);
  });
  it("can add tariff to prices", () => {
    const config = {
      validFrom: "2021-12-01",
      validTo: "2021-12-10",
      periods: [
        { start: "06", value: 10 },
        { start: "22", value: 11 },
      ],
    };
    const values = [];
    fillResult(values, 0, 5, 21);
    fillResult(values, 6, 21, 20);
    fillResult(values, 22, 23, 21);
    const prices = values.map((_, i) => {
      const start = DateTime.fromISO(config.validFrom).plus({ hours: i }).toISO();
      return {
        start,
        value: 10,
      };
    });
    const result = values.map((v, i) => {
      const start = DateTime.fromISO(config.validFrom).plus({ hours: i }).toISO();
      return {
        start,
        value: v,
      };
    });
    addTariffToPrices(console, config, prices);
    expect(prices).toEqual(result);
  });
  it("pass through when out of period", () => {
    const config = {
      validFrom: "2021-12-01",
      validTo: "2021-12-10",
      periods: [
        { start: "06", value: 10 },
        { start: "22", value: 11 },
      ],
    };
    const values = [];
    fillResult(values, 0, 23, 10);
    const prices = values.map((_, i) => {
      const start = DateTime.fromISO(config.validFrom).plus({ days: 20, hours: i }).toISO();
      return {
        start,
        value: 10,
      };
    });
    const result = values.map((v, i) => {
      const start = DateTime.fromISO(config.validFrom).plus({ days: 20, hours: i }).toISO();
      return {
        start,
        value: v,
      };
    });
    addTariffToPrices(console, config, prices);
    expect(prices).toEqual(result);
  });
});

function fillResult(arr, from, to, value) {
  for (let start = from; start <= to; start++) {
    arr[start] = value;
  }
}

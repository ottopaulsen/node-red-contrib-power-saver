const expect = require("chai").expect;
const { DateTime } = require("luxon");
const { addTariffToPrices } = require("../src/general-add-tariff-functions");

describe("general-add-tariff-functions", () => {
  it("can add tariff to prices", () => {
    const config = {
      validFrom: "2021-12-01",
      validTo: "2021-12-10",
      periods: [
        { start: "06", value: 10 },
        { start: "22", value: 11 },
      ],
      days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
    };
    const values = [];
    fillResult(values, 0, 5, 21);
    fillResult(values, 6, 21, 20);
    fillResult(values, 22, 23, 21);
    const prices = values.map((_, i) => {
      const start = DateTime.fromISO(config.validFrom).plus({ hours: i }).toISO();
      const res = {
        start,
        value: 10,
      };
      if (i === values.length - 1) {
        res.end = DateTime.fromISO(config.validFrom)
          .plus({ hours: i + 1 })
          .toISO();
      }
      return res;
    });
    const expected = values.map((v, i) => {
      const start = DateTime.fromISO(config.validFrom).plus({ hours: i }).toISO();
      return {
        start,
        value: v,
      };
    });
    expected[expected.length - 1].end = "2021-12-02T00:00:00.000+01:00";
    const result = addTariffToPrices(console, config, prices);
    expect(result).to.eql(expected);
  });
  it("pass through when out of period", () => {
    const config = {
      validFrom: "2021-12-01",
      validTo: "2021-12-10",
      periods: [
        { start: "06", value: 10 },
        { start: "22", value: 11 },
      ],
      days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
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
    expect(prices).to.eql(result);
  });
  it("adds tariff when valid from and to are empty strings", () => {
    const config = {
      validFrom: "",
      validTo: "",
      periods: [
        { start: "22", value: "0.2379" },
        { start: "06", value: "0.3779" },
      ],
      days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true },
    };
    const prices = [
      { start: "2026-10-19T00:00:00.000+02:00", value: 0.5, end: "2026-10-21T00:00:00.000+02:00" },
    ];
    const result = addTariffToPrices(console, config, prices);
    expect(result).to.eql([
      { start: "2026-10-19T00:00:00.000+02:00", value: 0.7379 },
      { start: "2026-10-19T06:00:00.000+02:00", value: 0.8779 },
      { start: "2026-10-19T22:00:00.000+02:00", value: 0.7379 },
      { start: "2026-10-20T06:00:00.000+02:00", value: 0.8779 },
      { start: "2026-10-20T22:00:00.000+02:00", value: 0.7379, end: "2026-10-21T00:00:00.000+02:00" },
    ]);
  });
});

function fillResult(arr, from, to, value) {
  for (let start = from; start <= to; start++) {
    arr[start] = value;
  }
}

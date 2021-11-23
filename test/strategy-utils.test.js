const { DateTime } = require("luxon");
const expect = require("expect");
const { getStartTimesInPeriod, isTimeInsidePeriod } = require("../strategy-utils");
const convertedPrices = require("./data/converted-prices.json");

describe("strategy-utils", () => {
  it("can getStartTimesInPeriod", () => {
    const startTimes = convertedPrices.priceData.map((p) => p.start);
    console.log("startTimes:", startTimes);
    period = getStartTimesInPeriod("12:00", "12:00", startTimes);
    validatePeriod(period, "", "", 24);
  });

  it("can check isTimeInsidePeriod", () => {
    const now = DateTime.local(2021, 11, 22, 20, 26);
    expect(isTimeInsidePeriod(now, "00:00", "23:59")).toBeTruthy();
    expect(isTimeInsidePeriod(now, "00:00", "00:00")).toBeTruthy();
    expect(isTimeInsidePeriod(now, "20:26", "20:26")).toBeTruthy();
    expect(isTimeInsidePeriod(now, "20:25", "20:26")).toBeFalsy();
    expect(isTimeInsidePeriod(now, "20:27", "20:26")).toBeFalsy();
  });
});

function validatePeriod(period, start, end, count) {
  expect(period.length).toEqual(count);
  expect(period[0]).toEqual(start);
  expect(period[count - 1]).toEqual(end);
}

const expect = require("expect");
const mostSavedStrategy = require("../mostSavedStrategy");

const prices = require("./data/prices");

describe("mostSavedStrategy", () => {
  it("saves correct hours", () => {
    const values = prices.today.map((p) => p.value);
    expect(mostSavedStrategy.calculate(values, 3, 1, 0.001)).toEqual([
      true,
      true,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      true,
    ]);
    expect(mostSavedStrategy.calculate(values, 3, 1, 0.001)).toEqual([
      true,
      true,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      true,
    ]);
    expect(mostSavedStrategy.calculate(values, 2, 1, 0.001)).toEqual([
      true,
      true,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      true,
    ]);
    expect(mostSavedStrategy.calculate(values, 2, 3, 0.001)).toEqual([
      true,
      true,
      true,
      false,
      true,
      true,
      false,
      false,
      true,
      true,
    ]);
    expect(mostSavedStrategy.calculate(values, 2, 0, 0.001)).toEqual([
      true,
      true,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      true,
    ]);
    const values2 = prices.tomorrow.map((p) => p.value);
    expect(mostSavedStrategy.calculate(values2, 2, 1, 0.001, true, 1)).toEqual([
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      true,
    ]);
    expect(mostSavedStrategy.calculate(values2, 2, 1, 0.001, false, 1)).toEqual(
      [true, false, true, false, false, true, false, false, true, true]
    );
  });
});

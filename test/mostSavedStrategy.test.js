const expect = require("expect");
const mostSavedStrategy = require("../mostSavedStrategy");

const prices = require("./data/prices");

describe("mostSavedStrategy", () => {
  it("saves correct hours", () => {
    const values = prices.today.map((p) => p.value);
    expect(mostSavedStrategy.calculate(values, 6, 3, 1)).toEqual([
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
    expect(mostSavedStrategy.calculate(values, 4, 3, 1)).toEqual([
      true,
      true,
      true,
      false,
      true,
      false,
      false,
      false,
      true,
      true,
    ]);
    expect(mostSavedStrategy.calculate(values, 5, 2, 1)).toEqual([
      true,
      true,
      false,
      false,
      true,
      true,
      false,
      false,
      true,
      true,
    ]);
    expect(mostSavedStrategy.calculate(values, 5, 2, 3)).toEqual([
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
    expect(mostSavedStrategy.calculate(values, 5, 2, 0)).toEqual([
      true,
      true,
      false,
      false,
      true,
      true,
      false,
      false,
      true,
      true,
    ]);
    const values2 = prices.tomorrow.map((p) => p.value);
    expect(mostSavedStrategy.calculate(values2, 5, 2, 1, true, 1)).toEqual([
      false,
      false,
      true,
      false,
      true,
      true,
      false,
      false,
      true,
      true,
    ]);
    expect(mostSavedStrategy.calculate(values2, 5, 2, 1, false, 1)).toEqual([
      true,
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
  });
});

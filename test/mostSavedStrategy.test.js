const expect = require("expect");
const { calculate, isOnOffSequencesOk } = require("../src/strategy-best-save-functions");

const prices = require("./data/prices");

describe("mostSavedStrategy", () => {
  it("evaluates onOff sequences correct", () => {
    expect(isOnOffSequencesOk([], 0, 0)).toBeTruthy();
    expect(isOnOffSequencesOk([true], 0, 0)).toBeTruthy();
    expect(isOnOffSequencesOk([false], 0, 0)).toBeFalsy();
    expect(isOnOffSequencesOk([true, false], 0, 0)).toBeFalsy();
    expect(isOnOffSequencesOk([true, false], 1, 0)).toBeTruthy();
    const onOff = [true, true, false, false, false, true, true, false];
    expect(isOnOffSequencesOk(onOff, 3, 2)).toBeTruthy();
    expect(isOnOffSequencesOk(onOff, 4, 2)).toBeTruthy();
    expect(isOnOffSequencesOk(onOff, 2, 2)).toBeFalsy();
    expect(isOnOffSequencesOk(onOff, 3, 3)).toBeFalsy();
  });

  it("saves correct hours", () => {
    const values = prices.today.map((p) => p.value);
    expect(calculate(values, 3, 1, 0.001)).toEqual([true, true, false, false, true, false, false, false, true, true]);
    expect(calculate(values, 3, 1, 0.001)).toEqual([true, true, false, false, true, false, false, false, true, true]);
    expect(calculate(values, 2, 1, 0.001)).toEqual([true, true, true, false, false, true, false, false, true, true]);
    expect(calculate(values, 2, 3, 0.001)).toEqual([true, true, true, false, true, true, false, false, true, true]);
    expect(calculate(values, 2, 0, 0.001)).toEqual([true, true, true, false, false, true, false, false, true, true]);
    const values2 = prices.tomorrow.map((p) => p.value);
    expect(calculate(values2, 2, 1, 0.001, true, 1)).toEqual([
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
    expect(calculate(values2, 2, 1, 0.001, false, 1)).toEqual([
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

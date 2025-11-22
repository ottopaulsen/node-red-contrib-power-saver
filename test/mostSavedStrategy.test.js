const expect = require("chai").expect;
const { calculate, isOnOffSequencesOk } = require("../src/strategy-best-save-functions");

const prices = require("./data/prices");

describe("mostSavedStrategy", () => {
  it("evaluates onOff sequences correct", () => {
    expect(isOnOffSequencesOk([], 0, 0, 1)).to.equal(true);
    expect(isOnOffSequencesOk([true], 0, 0, 1)).to.equal(true);
    expect(isOnOffSequencesOk([false], 0, 0, 1)).to.equal(false);
    expect(isOnOffSequencesOk([true, false], 0, 0, 1)).to.equal(false);
    expect(isOnOffSequencesOk([true, false], 1, 0, 1)).to.equal(true);
    const onOff = [true, true, false, false, false, true, true, false];
    expect(isOnOffSequencesOk(onOff, 3, 2, 1)).to.equal(true);
    expect(isOnOffSequencesOk(onOff, 4, 2, 1)).to.equal(true);
    expect(isOnOffSequencesOk(onOff, 2, 2, 1)).to.equal(false);
    // expect(isOnOffSequencesOk(onOff, 3, 3, 1)).to.equal(false);
    // New tests
    expect(isOnOffSequencesOk(onOff, 3, 3, 100)).to.equal(false);
    expect(isOnOffSequencesOk(onOff, 3, 3, 50)).to.equal(true);
    expect(isOnOffSequencesOk(onOff, 3, 3, 50, 3)).to.equal(true);
    expect(isOnOffSequencesOk(onOff, 3, 3, 100)).to.equal(false);
    expect(isOnOffSequencesOk(onOff, 3, 3, 90)).to.equal(false);
  });
  it("evaluates onOff sequences correct with strange input", () => {
    const onOff = [true, true, false, false, false, true, true, false];
    expect(isOnOffSequencesOk(onOff, 3, 3, 100, null)).to.equal(false);
    expect(isOnOffSequencesOk(onOff, 3, 3, 100, "")).to.equal(false);

  });

  it("evaluates a long onOff sequence correct", () => {
    const minutesSetting = [
      { count: 465, value: true },
      { count: 75, value: false },
      { count: 541, value: true },
      { count: 74, value: false },
      { count: 15, value: true },
      { count: 75, value: false },
      { count: 1335, value: true },
      { count: 75, value: false },
      { count: 315, value: true },
    ];

    const minutes = [];
    minutesSetting.forEach((ms) => {
      for (let i = 0; i < ms.count; i++) {
        minutes.push(ms.value);
      }
    });

    expect(isOnOffSequencesOk(minutes, 75, 15, 85)).to.equal(false);

  });

  it("saves correct hours", () => {
    const values = prices.today.map((p) => p.value);
    // expect(calculate(values, 3, 1, 1, null, 0.001)).to.eql([true, true, false, false, true, false, false, false, true, true]);
    // expect(calculate(values, 3, 1, 1, null, 0.001)).to.eql([true, true, false, false, true, false, false, false, true, true]);
    // expect(calculate(values, 2, 1, 1, null, 0.001)).to.eql([true, true, true, false, false, true, false, false, true, true]);
    // expect(calculate(values, 2, 2, 1, null, 0.001)).to.eql([true, true, true, false, false, true, false, false, true, true]);
    // expect(calculate(values, 2, 0, 1, null, 0.001)).to.eql([true, true, true, false, false, true, false, false, true, true]);
    const values2 = prices.tomorrow.map((p) => p.value);
    expect(calculate(values2, 2, 1, 1, null, 0.001, true, 1)).to.eql([
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
    expect(calculate(values2, 2, 1, 1, null, 0.001, false, 1)).to.eql([
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

const expect = require("chai").expect;
const { toNumericPriceData, validateInput } = require("../src/handle-input");

function useNodeMock() {
  const warnings = [];
  return {
    warnings,
    status: () => {},
    warn: (message) => warnings.push(message),
  };
}

const start = "2021-06-20T00:00:00.000+02:00";
const nextStart = "2021-06-20T01:00:00.000+02:00";
const malformedWarning = "Malformed entries in priceData. All entries must contain start and value.";

describe("validateInput", () => {
  it("accepts price data with numbers", () => {
    const node = useNodeMock();
    expect(validateInput(node, { payload: { priceData: [{ start, value: 0.5 }] } })).to.equal(true);
    expect(node.warnings).to.eql([]);
  });

  it("accepts prices given as strings", () => {
    const node = useNodeMock();
    const priceData = [
      { start, value: "0.5" },
      { start: nextStart, value: "-1.25" },
    ];
    expect(validateInput(node, { payload: { priceData } })).to.equal(true);
    expect(node.warnings).to.eql([]);
  });

  it("rejects values that are only numbers by coercion", () => {
    [null, true, false, [], "", "  ", "abc", {}].forEach((value) => {
      const node = useNodeMock();
      expect(validateInput(node, { payload: { priceData: [{ start, value }] } }), JSON.stringify(value)).to.not.equal(
        true,
      );
      expect(node.warnings).to.eql([malformedWarning]);
    });
  });

  it("rejects values that are not finite", () => {
    [NaN, Infinity, -Infinity, "Infinity"].forEach((value) => {
      const node = useNodeMock();
      expect(validateInput(node, { payload: { priceData: [{ start, value }] } }), String(value)).to.not.equal(true);
      expect(node.warnings).to.eql([malformedWarning]);
    });
  });

  it("rejects an entry without start", () => {
    const node = useNodeMock();
    const priceData = [{ start, value: 1 }, { value: 2 }];
    expect(validateInput(node, { payload: { priceData } })).to.not.equal(true);
    expect(node.warnings).to.eql([malformedWarning]);
  });

  it("rejects a malformed entry anywhere in the array", () => {
    // A return inside the forEach this replaced only left the callback, so a
    // malformed entry was warned about and then accepted.
    const node = useNodeMock();
    const priceData = [
      { start, value: 1 },
      { start: nextStart, value: NaN },
    ];
    expect(validateInput(node, { payload: { priceData } })).to.not.equal(true);
  });

  it("reports the other validation failures", () => {
    const cases = [
      [{}, "No payload"],
      [{ payload: "text" }, "Payload is not an object"],
      [{ payload: {} }, "Payload is missing priceData"],
      [{ payload: { priceData: {} } }, "Illegal payload"],
      [{ payload: { priceData: [] } }, "priceData is empty"],
    ];
    cases.forEach(([msg, expected]) => {
      const node = useNodeMock();
      expect(validateInput(node, msg)).to.not.equal(true);
      expect(node.warnings[0]).to.contain(expected === "Illegal payload" ? "Illegal priceData" : expected);
    });
  });

  it("accepts config and command messages without price data", () => {
    const node = useNodeMock();
    expect(validateInput(node, { payload: { config: { override: "auto" } } })).to.equal(true);
    expect(validateInput(node, { payload: { commands: { replan: true } } })).to.equal(true);
    expect(node.warnings).to.eql([]);
  });
});

describe("toNumericPriceData", () => {
  it("converts string prices to numbers", () => {
    const priceData = [
      { start, value: "0.5" },
      { start: nextStart, value: "-1.25", end: nextStart },
    ];
    expect(toNumericPriceData(priceData)).to.eql([
      { start, value: 0.5 },
      { start: nextStart, value: -1.25, end: nextStart },
    ]);
  });

  it("leaves numbers and the input array alone", () => {
    const priceData = [{ start, value: 0.5 }];
    const result = toNumericPriceData(priceData);
    expect(result).to.eql(priceData);
    expect(result[0]).to.equal(priceData[0]);
  });

  it("makes string prices add up instead of concatenating", () => {
    const priceData = [
      { start, value: "0.5" },
      { start: nextStart, value: "0.2" },
    ];
    const sum = toNumericPriceData(priceData).reduce((prev, entry) => prev + entry.value, 0);
    expect(sum).to.equal(0.7);
  });
});

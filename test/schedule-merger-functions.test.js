const { DateTime } = require("luxon");
const expect = require("chai").expect;
const { validateSchedule, saveSchedule, mergeSchedules, runSchedule } = require("../src/schedule-merger-functions");
const bestSaveResult = require("./data/best-save-result.json");
const mergeData = require("./data/merge-schedule-data.js");
const cloneDeep = require("lodash.clonedeep");

describe("schedule-merger-functions", () => {
  it("saveSchedule", () => {
    const node = useNodeMock();
    const msg = { payload: cloneDeep(bestSaveResult) };
    msg.payload.strategyNodeId = "1";
    msg.payload.minutes[0].onOff = false;
    saveSchedule(node, msg);
    expect(node.context().get()["1"]).to.eql(msg.payload);

    msg.payload.strategyNodeId = "2";
    msg.payload.minutes[0].onOff = true;
    saveSchedule(node, msg);
    expect(node.context().get()["2"]).to.eql(msg.payload);
    expect(node.context().get()["1"].minutes[0].onOff).to.equal(false);
    expect(node.context().get()["2"].minutes[0].onOff).to.equal(true);
  });

  it("mergeSchedule", () => {
    const messages = {};
    Object.keys(mergeData).forEach((ds) => {
      messages[ds] = {
        payload: {
          strategyNodeId: ds,
          minutes: mergeData[ds],
        },
      };
    });

    let node = useNodeMock();
    saveSchedule(node, messages.allOff);
    expect(mergeSchedules(node, "OR").map((h) => h.onOff)).to.eql([false, false, false, false, false]);
    saveSchedule(node, messages.allOn);
    expect(mergeSchedules(node, "OR").map((h) => h.onOff)).to.eql([true, true, true, true, true]);
    expect(mergeSchedules(node, "AND").map((h) => h.onOff)).to.eql([false, false, false, false, false]);

    node = useNodeMock();
    saveSchedule(node, messages.someOn);
    saveSchedule(node, messages.allOn);
    expect(mergeSchedules(node, "OR").map((h) => h.onOff)).to.eql([true, true, true, true, true]);
    expect(mergeSchedules(node, "AND").map((h) => h.onOff)).to.eql([true, false, true, false, true]);

    node = useNodeMock();
    saveSchedule(node, messages.someOn);
    saveSchedule(node, messages.allOff);
    expect(mergeSchedules(node, "OR").map((h) => h.onOff)).to.eql([true, false, true, false, true]);
    expect(mergeSchedules(node, "AND").map((h) => h.onOff)).to.eql([false, false, false, false, false]);
    saveSchedule(node, messages.hourLater);
    expect(mergeSchedules(node, "OR").map((h) => h.onOff)).to.eql([true, false, false, true, true]);
    expect(mergeSchedules(node, "AND").map((h) => h.onOff)).to.eql([true, false, false, true, true]);

    saveSchedule(node, messages.someOn);
    saveSchedule(node, messages.allOff);
    expect(mergeSchedules(node, "OR").map((h) => h.onOff)).to.eql([true, false, true, false, true]);
    expect(mergeSchedules(node, "AND").map((h) => h.onOff)).to.eql([false, false, false, false, false]);

    node = useNodeMock();
    saveSchedule(node, messages.someOn);
    saveSchedule(node, messages.lessHours);
    expect(mergeSchedules(node, "OR").map((h) => h.onOff)).to.eql([false, true, false]);

    node = useNodeMock();
    saveSchedule(node, messages.someOn);
    saveSchedule(node, messages.moreHours);
    expect(mergeSchedules(node, "OR").map((h) => h.onOff)).to.eql([true, true, false, false, false, true, true, false]);
  });
});

// Node mock
const useNodeMock = function () {
  let savedSchedules = {};
  const set = function (_, obj) {
    savedSchedules = { ...obj };
  };
  const get = function () {
    return savedSchedules;
  };
  const context = function () {
    return { get, set };
  };
  const warn = function (msg) {
    console.log(msg);
  };
  return { context, warn };
};

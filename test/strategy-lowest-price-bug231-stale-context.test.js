/**
 * Regression test for GitHub issue #231 - stale day-before context.
 *
 * Scenario: 15-minute interval price data, overnight scheduling window (20:00-05:00),
 * 180 minutes on, doNotSplit. After sending day-1 price data and then day-2 price data
 * (without reset), the node loads the saved day-1 context as "day before" and includes
 * it in the day-2 plan. This produces a schedule with stale entries from day-1's window
 * (Jan 8 23:45) alongside the correct day-2 entry (Jan 10 02:00).
 *
 * The correct behavior: after new price data is sent, the resulting schedule should
 * only contain entries within the new price data's time range (Jan 9 onwards), not
 * from the previous day (Jan 8).
 */

const expect = require("chai").expect;
const helper = require("node-red-node-test-helper");
const lowestPrice = require("../src/strategy-lowest-price.js");
const day1 = require("./data/bug-231-day1.json");
const day2 = require("./data/bug-231-day2.json");

helper.init(require.resolve("node-red"));

describe("ps-strategy-lowest-price bug 231 - stale day-before context", function () {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });

  it("schedule after new price data should not contain entries from the previous day", function (done) {
    const flow = [
      {
        id: "n1",
        type: "ps-strategy-lowest-price",
        name: "bug 231 stale context test",
        fromHour: 20,
        fromMinute: 0,
        toHour: 5,
        toMinute: 0,
        minutesOn: 180,
        maxPrice: 0.3,
        doNotSplit: true,
        sendCurrentValueWhenRescheduling: true,
        outputIfNoSchedule: false,
        outputOutsidePeriod: false,
        wires: [[], [], ["n2"]],
      },
      { id: "n2", type: "helper" },
    ];

    helper.load(lowestPrice, flow, function () {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");

      let pass = 1;
      n2.on("input", function (msg) {
        if (pass === 1) {
          pass++;
          // Day-1 schedule received; now send day-2 data (simulating the next day's run)
          n1.receive({ payload: { ...day2, time: "2026-01-09T20:00:00.000+01:00" } });
        } else {
          // Day-2 schedule: should only contain entries from Jan 9 onwards.
          // If the bug is present, the schedule starts at 2026-01-08 (stale day-before data).
          try {
            const schedule = msg.payload.schedule;
            const firstEntryTime = new Date(schedule[0].time);
            const day2DataStart = new Date("2026-01-09T16:15:00+01:00");

            expect(firstEntryTime).to.be.at.least(
              day2DataStart,
              `Schedule starts at ${schedule[0].time} which is before the day-2 data range. ` +
                `Stale day-before context is leaking into the new schedule.`,
            );

            // The correct schedule has exactly 3 entries and one on-period on Jan 10
            expect(schedule).to.have.length(3);
            expect(schedule[1].time).to.equal("2026-01-10T02:00:00.000+01:00");
            expect(schedule[1].value).to.equal(true);
            expect(schedule[1].countMinutes).to.equal(180);

            done();
          } catch (err) {
            done(err);
          }
        }
      });

      // Send day-1 price data first (Jan 8-9), which saves Jan 8 data to context
      n1.receive({ payload: { ...day1, time: "2026-01-08T20:00:00.000+01:00" } });
    });
  });
});

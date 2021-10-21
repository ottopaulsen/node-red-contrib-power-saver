const {
  sortedIndex,
  getDiffToNextOn,
  isOnOffSequencesOk,
  fillArray,
} = require("./utils");
/**
 * Turn off the hours where you save most compared to the next hour on.
 *
 * Algorithm:
 * 1. For each hour, find out how much is saved if turned off.
 *    Compare price with the net hour that is on.
 * 2. Turn off the hour that saves the most.
 * 3. Validate. Keep if valid. If not, turn off the next best. And so on.
 *    When validating, include hours from day before, but do not fail on day before.
 * 4. If something was turned off, repeat from 1.
 *
 * @param {*} values Array of prices
 * @param {*} maxOffInARow Max number of hours that can be saved in a row
 * @param {*} minOnAfterMaxOffInARow Min number of hours that must be on after maxOffInARow is saved
 * @param {*} minSaving Minimum amount that must be saved in order to turn off
 * @param {*} lastValueDayBefore Value of the last hour the day before
 * @param {*} lastCountDayBefore Number of lastValueDayBefore in a row
 * @returns Array with same number of values as in values array, where true is on, false is off
 */
module.exports = {
  calculate: function (
    values,
    maxOffInARow,
    minOnAfterMaxOffInARow,
    minSaving,
    lastValueDayBefore = undefined,
    lastCountDayBefore = 0
  ) {
    const dayBefore = fillArray(lastValueDayBefore, lastCountDayBefore);
    let foundImprovement;
    const onOff = values.map((v) => true); // Start with all on
    do {
      foundImprovement = false;
      const diffToNextOn = getDiffToNextOn(
        values,
        onOff,
        values[values.length - 1]
      );
      const sorted = sortedIndex(diffToNextOn).filter(
        (v) => onOff[v] && diffToNextOn[v] >= minSaving
      );
      let tryToTurnOffIndex = 0;
      while (tryToTurnOffIndex < sorted.length && !foundImprovement) {
        onOff[sorted[tryToTurnOffIndex]] = false;
        if (
          isOnOffSequencesOk(
            [...dayBefore, ...onOff],
            maxOffInARow,
            minOnAfterMaxOffInARow
          )
        ) {
          foundImprovement = true;
        } else {
          onOff[sorted[tryToTurnOffIndex]] = true;
          tryToTurnOffIndex++;
        }
      }
    } while (foundImprovement);

    return onOff;
  },
};

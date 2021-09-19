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
 * @param {*} maxOffCount Max number of hours that can be saved in total
 * @param {*} maxOffInARow Max number of hours that can be saved in a row
 * @param {*} minOnAfterMaxOffInARow Min number of hours that must be on after maxOffInARow is saved
 * @param {*} lastValueDayBefore Value of the last hour the day before
 * @param {*} lastCountDayBefore Number of lastValueDayBefore in a row
 * @returns Array with same number of values as in values array, where true is on, false is off
 */
module.exports = {
  calculate: function (
    values,
    maxOffCount,
    maxOffInARow,
    minOnAfterMaxOffInARow,
    lastValueDayBefore = undefined,
    lastCountDayBefore = 0
  ) {
    const dayBefore = fillArray(lastValueDayBefore, lastCountDayBefore);
    let minSave = 0.001;
    let foundImprovement;
    const onOff = values.map((v) => true); // Start with all on
    if (maxOffCount <= 0) {
      return onOff;
    }
    do {
      foundImprovement = false;
      const diffToNextOn = getDiffToNextOn(values, onOff);
      const sorted = sortedIndex(diffToNextOn).filter(
        (v) => onOff[v] && diffToNextOn[v] >= minSave
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
    } while (foundImprovement && onOff.filter((v) => !v).length < maxOffCount);

    return onOff;
  },
};

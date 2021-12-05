"use strict";

const { fillArray } = require("./utils");

/**
 * Takes an array of true/false values where true means on and false means off.
 * Evaluates of the on/off sequences are valid according to other arguments.
 *
 * @param {*} onOff Array of on/off values
 * @param {*} maxOff Max number of values that can be off in a sequence
 * @param {*} minOnAfterOff Min number of values that must be on after maxOff is reached
 * @returns
 */
function isOnOffSequencesOk(onOff, maxOff, minOnAfterOff) {
  let offCount = 0;
  let onCount = 0;
  let reachedMaxOff = false;
  for (let i = 0; i < onOff.length; i++) {
    if (!onOff[i]) {
      if (maxOff === 0 || reachedMaxOff) {
        return false;
      }
      offCount++;
      onCount = 0;
      if (offCount >= maxOff) {
        reachedMaxOff = true;
      }
    } else {
      if (reachedMaxOff) {
        onCount++;
        if (onCount >= minOnAfterOff) {
          reachedMaxOff = false;
        }
      }
      offCount = 0;
    }
  }
  return true;
}

/**
 * Turn off the hours where you save most compared to the next hour on.
 *
 * @param {*} values Array of prices
 * @param {*} maxOffInARow Max number of hours that can be saved in a row
 * @param {*} minOnAfterMaxOffInARow Min number of hours that must be on after maxOffInARow is saved
 * @param {*} minSaving Minimum amount that must be saved in order to turn off
 * @param {*} lastValueDayBefore Value of the last hour the day before
 * @param {*} lastCountDayBefore Number of lastValueDayBefore in a row
 * @returns Array with same number of values as in values array, where true is on, false is off
 */

function calculate(
  values,
  maxOffInARow,
  minOnAfterMaxOffInARow,
  minSaving,
  lastValueDayBefore = undefined,
  lastCountDayBefore = 0
) {
  const dayBefore = fillArray(lastValueDayBefore, lastCountDayBefore);
  const last = values.length - 1;

  // Create matrix with saving per hour
  const savingPerHour = [];
  for (let hour = 0; hour < last; hour++) {
    const row = [];
    for (let count = 1; count <= maxOffInARow; count++) {
      const on = hour + count;
      const saving = values[hour] - values[on >= last ? last : on];
      row.push(saving);
    }
    savingPerHour.push(row);
  }

  // Create list with summary saving per sequence
  let savingsList = [];
  for (let hour = 0; hour < last; hour++) {
    for (let count = 1; count <= maxOffInARow; count++) {
      let saving = 0;
      for (let offset = 0; offset < count && hour + offset < last; offset++) {
        saving += savingPerHour[hour + offset][count - offset - 1];
      }
      if (saving > minSaving * count && hour + count <= last && values[hour] > values[hour + count] + minSaving) {
        savingsList.push({ hour, count, saving });
      }
    }
  }

  savingsList.sort((a, b) => b.saving - a.saving);
  let onOff = values.map((v) => true); // Start with all on

  // Find the best possible sequences
  while (savingsList.length > 0) {
    const { hour, count } = savingsList[0];
    const onOffCopy = [...onOff];
    for (let c = 0; c < count; c++) {
      onOff[hour + c] = false;
    }
    if (isOnOffSequencesOk([...dayBefore, ...onOff], maxOffInARow, minOnAfterMaxOffInARow)) {
      savingsList = savingsList.filter((s) => s.hour < hour || s.hour >= hour + count);
    } else {
      onOff = [...onOffCopy];
      savingsList.splice(0, 1);
    }
  }
  return onOff;
}

module.exports = { calculate, isOnOffSequencesOk };

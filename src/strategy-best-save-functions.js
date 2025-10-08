"use strict";

const { fillArray } = require("./utils");

/**
 * Takes an array of true/false values where true means on and false means off.
 * Evaluates of the on/off sequences are valid according to other arguments.
 *
 * @param {*} onOff Array of on/off values
 * @param {*} maxMinutesOff Max number of minutes that can be off in a sequence
 * @param {*} minMinutesOff Min number of minutes that must be on after maxOff is reached
 * @returns
 */
function isOnOffSequencesOk(
  onOff, 
  maxMinutesOff,
  minMinutesOff,
  recoveryPercentage,
  recoveryMaxMinutes = null,
  minSaving) {
  let offCount = 0;
  let onCount = 0;
  let reachedMaxOff = false;
  let reachedMinOn = minMinutesOff === 0;
  let minOnAfterOff = null;
  for (let i = 0; i < onOff.length; i++) {
    if (!onOff[i]) {
      if (maxMinutesOff === 0 || reachedMaxOff) {
        return false;
      }
      offCount++;
      onCount = 0;
      if (offCount >= maxMinutesOff) {
        reachedMaxOff = true;
      }
      if (offCount >= minMinutesOff) {
        reachedMinOn = true;
      }
      const minRounded = Math.max(Math.round(offCount * recoveryPercentage / 100), 1)
      minOnAfterOff = Math.min(minRounded, recoveryMaxMinutes ?? minRounded)
    } else {
      onCount++;
      if (onCount >= minOnAfterOff) {
        reachedMaxOff = false;
      }
      offCount = 0;
    }
  }
  return reachedMinOn;
}

/**
 * Turn off the minutes where you save most compared to the next minute on.
 *
 * @param {*} values Array of prices
 * @param {*} maxMinutesOff Max number of minutes that can be saved in a row
 * @param {*} minMinutesOff Min number of minutes to turn off in a row
 * @param {*} recoveryPercentage Min percent of time off that must be on after being off
 * @param {*} recoveryMaxMinutes Maximum recovery time in minutes
 * @param {*} minSaving Minimum amount that must be saved in order to turn off
 * @param {*} lastValueDayBefore Value of the last minute the day before
 * @param {*} lastCountDayBefore Number of lastValueDayBefore in a row
 * @returns Array with same number of values as in values array, where true is on, false is off
 */

function calculate(
  values,
  maxMinutesOff,
  minMinutesOff,
  recoveryPercentage,
  recoveryMaxMinutes,
  minSaving,
  lastValueDayBefore = undefined,
  lastCountDayBefore = 0
) {
  const dayBefore = fillArray(lastValueDayBefore, lastCountDayBefore);
  const last = values.length - 1;

  // Create matrix with saving per minute
  const savingPerMinute = [];
  for (let minutes = 0; minutes < last; minutes++) {
    const row = [];
    for (let count = 1; count <= maxMinutesOff; count++) {
      const on = minutes + count;
      const saving = values[minutes] - values[on >= last ? last : on];
      row.push(saving);
    }
    savingPerMinute.push(row);
  }

  // Create list with summary saving per sequence
  let savingsList = [];
  for (let minute = 0; minute < last; minute++) {
    for (let count = 1; count <= maxMinutesOff; count++) {
      let saving = 0;
      for (let offset = 0; offset < count && minute + offset < last; offset++) {
        saving += savingPerMinute[minute + offset][count - offset - 1];
      }
      if (saving > minSaving * count && minute + count <= last && values[minute] > values[minute + count] + minSaving) {
        savingsList.push({ minute, count, saving });
      }
    }
  }

  savingsList.sort((a, b) => b.saving === a.saving ? a.count - b.count : b.saving - a.saving);
  let onOff = values.map((v) => true); // Start with all on

  // Find the best possible sequences
  while (savingsList.length > 0) {
    const { minute, count } = savingsList[0];
    const onOffCopy = [...onOff];
    let alreadyTaken = false;
    for (let c = 0; c < count; c++) {
      if (!onOff[minute + c]) {
        alreadyTaken = true;
      }
      onOff[minute + c] = false;
    }
    if (isOnOffSequencesOk([...dayBefore, ...onOff], maxMinutesOff, minMinutesOff, recoveryPercentage,
      recoveryMaxMinutes) && !alreadyTaken) {
      savingsList = savingsList.filter((s) => s.minute < minute || s.minute >= minute + count);
    } else {
      onOff = [...onOffCopy];
      savingsList.splice(0, 1);
    }
  }
  return onOff;
}

module.exports = { calculate, isOnOffSequencesOk };

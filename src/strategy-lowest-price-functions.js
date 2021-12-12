const cloneDeep = require("lodash.clonedeep");
const { sortedIndex } = require("./utils");

function getBestContinuous(values, count) {
  let min = values.reduce((p, v) => p + v, 0);
  let minIndex = 0;
  for (let i = 0; i <= values.length - count; i++) {
    let sum = 0;
    for (let j = 0; j < count; j++) {
      sum += values[i + j];
    }
    if (sum < min) {
      min = sum;
      minIndex = i;
    }
  }
  const onOff = cloneDeep(values)
    .fill(false)
    .fill(true, minIndex, minIndex + count);
  return onOff;
}

function getBestX(values, count) {
  const sorted = sortedIndex(values);
  const onOff = cloneDeep(values).fill(true);
  for (let i = 0; i < sorted.length - count; i++) {
    onOff[sorted[i]] = false;
  }
  return onOff;
}

module.exports = {
  getBestContinuous,
  getBestX,
};

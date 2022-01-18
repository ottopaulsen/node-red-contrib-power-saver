<template>
  <textarea rows="5" cols="80" name="rawData" placeHolder="Paste data here" v-model="dataString"></textarea>
  <p>{{ message }}</p>
  <div class="config" v-if="message === '' && payload.version">
    <h3>Config:</h3>
    <p>Max in sequence: {{ payload.config.maxHoursToSaveInSequence }}</p>
    <p>Min on after max: {{ payload.config.minHoursOnAfterMaxSequenceSaved }}</p>
    <p>Max in sequence: {{ payload.config.maxHoursToSaveInSequence }}</p>
    <p>Minimum saving: {{ payload.config.minSaving }}</p>
    <p>Send when rescheduling: {{ payload.config.sendCurrentValueWhenRescheduling ? "Yes" : "No" }}</p>
    <p>If no schedule, output: {{ payload.config.outputIfNoSchedule ? "On" : "Off" }}</p>
    <h3>Meta data:</h3>
    <p>Node version: {{ payload.version }}</p>
    <p>Data timestamp: {{ payload.time }}</p>
    <p>Price source: {{ payload.source }}</p>
    <p>Current output: {{ payload.current ? "On" : "Off" }}</p>
    <hr />
    <h3>Hours:</h3>

    <div>
      <input type="checkbox" id="showNegative" v-model="showNegative" />
      <label for="showNegative">Show negative</label>

      <label style="margin-left: 40px">Show saving per sequence as:</label>
      <input type="radio" id="sum" value="sum" v-model="show" />
      <label for="sum">Sum</label>
      <input type="radio" id="avg" value="avg" v-model="show" />
      <label for="avg">Average</label>
    </div>

    <table>
      <tr>
        <th colspan="5">Input data</th>
        <th class="sepcol"></th>
        <th :colspan="differenceColumns.length">Saving if turned off x hours</th>
        <th class="sepcol"></th>
        <th :colspan="differenceColumns.length">Saving for sequence of x hours</th>
      </tr>
      <tr>
        <th>Date</th>
        <th>Hour</th>
        <th>Price</th>
        <th>On/Off</th>
        <th>Saving</th>
        <th class="sepcol"></th>
        <th v-for="h in differenceColumns" :key="h">
          {{ h }}
        </th>
        <th class="sepcol"></th>
        <th v-for="h in differenceColumns" :key="h">
          {{ h }}
        </th>
      </tr>
      <tr v-for="(hour, i) in payload.hours" :key="hour.start">
        <td>{{ DateTime.fromISO(hour.start).day }}</td>
        <td>{{ DateTime.fromISO(hour.start).toLocaleString(DateTime.TIME_SIMPLE) }}</td>
        <td :class="priceClasses(i)">{{ hour.price }}</td>
        <td>{{ hour.onOff ? "On" : "Off" }}</td>
        <td>{{ hour.saving ?? "" }}</td>
        <td class="sepcol"></td>
        <td v-for="(h, j) in differenceColumns" :key="h" @click="showSavingSource(i, j)" :class="savingClasses(i, j)">
          {{ showNegative || differencePerHour[i][j] > 0 ? differencePerHour[i][j] : "" }}
        </td>
        <td class="sepcol"></td>
        <td
          v-for="(h, j) in differenceColumns"
          :key="h"
          @click="showSequenceSource(i, j)"
          :class="sequenceClasses(i, j)"
        >
          {{
            showNegative || totalPerSequence[i][j] > 0
              ? "" + (showSum ? totalPerSequence[i][j] : averagePerSequence[i][j])
              : ""
          }}
        </td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
const { roundPrice } = require("../../../src/utils");
const { DateTime } = require("luxon");

const message = ref("");
const showNegative = ref(false);

const show = ref("avg");
const showSum = computed(() => show.value === "sum");

const dataString = ref("");
watch(dataString, (value) => {
  convert(value);
  calculatePotentialSavings();
  highlightSequence.length = 0;
  clickedSequence.row = null;
  clickedSequence.col = null;
  clickedSaving.row = null;
  clickedSaving.col = null;
});

const payload = reactive({});
function convert(value) {
  try {
    const obj = JSON.parse(value);
    const pl = obj.payload ?? obj;
    Object.keys(pl).forEach((key) => (payload[key] = pl[key]));
    message.value = "";
  } catch (e) {
    message.value = "No legal JSON data";
  }
}

const differencePerHour = reactive([]);
const differenceColumns = reactive([]);
const totalPerSequence = reactive([]);
const averagePerSequence = reactive([]);

function calculatePotentialSavings() {
  const hours = payload.hours;

  // Savings per hour
  for (let i = 0; i < payload.config.maxHoursToSaveInSequence; i++) {
    differenceColumns[i] = i + 1;
  }
  for (let i = 0; i < hours.length; i++) {
    const row = reactive([]);
    for (let j = 0; j < differenceColumns.length; j++) {
      row[j] = i + j + 1 < hours.length ? roundPrice(hours[i].price - hours[i + j + 1].price) : null;
    }
    differencePerHour[i] = row;
  }

  // Savings per sequence
  for (let i = 0; i < hours.length; i++) {
    const tot = reactive([]);
    const avg = reactive([]);
    for (let j = 0; j < differenceColumns.length; j++) {
      tot[j] = 0;
      for (let k = 0; k <= j; k++) {
        const res = tot[j] + (i + k < hours.length ? differencePerHour[i + k][j - k] : 0);
        tot[j] = roundPrice(res);
        avg[j] = roundPrice(res / (j + 1));
      }
      totalPerSequence[i] = tot;
      averagePerSequence[i] = avg;
    }
  }
}

// Show source for sequence sums
const highlightSequence = reactive([]);
const clickedSequence = reactive({ row: null, col: null });
function showSequenceSource(row, col) {
  const sameCell = row === clickedSequence.row && col === clickedSequence.col;
  highlightSequence.length = 0;
  clickedSequence.row = sameCell ? null : row;
  clickedSequence.col = sameCell ? null : col;
  for (let c = 0; c <= col && !sameCell; c++) {
    highlightSequence.push({ row: row + c, col: col - c });
  }
}

// Show source for saving
const clickedSaving = reactive({ row: null, col: null });
function showSavingSource(row, col) {
  const sameCell = row === clickedSaving.row && col === clickedSaving.col;
  clickedSaving.row = sameCell ? null : row;
  clickedSaving.col = sameCell ? null : col;
}

function priceClasses(i) {
  let hl =
    clickedSaving.row === null ? false : clickedSaving.row === i || clickedSaving.row + clickedSaving.col === i - 1;
  let res = hl ? "highlightSaving " : " ";
  return res;
}

function savingClasses(i, j) {
  const seq = highlightSequence.some((cell) => cell.row === i && cell.col === j);
  const sav = i === clickedSaving.row && j === clickedSaving.col;
  const res = "selectable ";
  if (seq & sav) {
    return res + "highlightBoth";
  }
  if (seq) {
    return res + "highlightSequence";
  }
  if (sav) {
    return res + "highlightSaving";
  }
  return res;
}

function sequenceClasses(i, j) {
  let res = clickedSequence.row === i && clickedSequence.col === j ? "highlightSequence " : " ";
  if (averagePerSequence[i][j] < payload.config.minSaving) {
    res = res + "belowMin ";
  }
  return res + "selectable";
}

// Only for dev.
// const testData =
//   '{"payload":{"schedule":[{"time":"2022-01-17T01:00:00.000+01:00","value":false},{"time":"2022-01-17T03:00:00.000+01:00","value":true},{"time":"2022-01-18T21:00:00.000+01:00","value":false},{"time":"2022-01-18T23:00:00.000+01:00","value":true}],"hours":[{"price":0.1969,"onOff":true,"start":"2022-01-17T00:00:00.000+01:00","saving":null},{"price":0.1799,"onOff":false,"start":"2022-01-17T01:00:00.000+01:00","saving":0.0438},{"price":0.1604,"onOff":false,"start":"2022-01-17T02:00:00.000+01:00","saving":0.0243},{"price":0.1361,"onOff":true,"start":"2022-01-17T03:00:00.000+01:00","saving":null},{"price":0.1704,"onOff":true,"start":"2022-01-17T04:00:00.000+01:00","saving":null},{"price":0.224,"onOff":true,"start":"2022-01-17T05:00:00.000+01:00","saving":null},{"price":0.2322,"onOff":true,"start":"2022-01-17T06:00:00.000+01:00","saving":null},{"price":0.2421,"onOff":true,"start":"2022-01-17T07:00:00.000+01:00","saving":null},{"price":0.243,"onOff":true,"start":"2022-01-17T08:00:00.000+01:00","saving":null},{"price":0.2439,"onOff":true,"start":"2022-01-17T09:00:00.000+01:00","saving":null},{"price":0.2429,"onOff":true,"start":"2022-01-17T10:00:00.000+01:00","saving":null},{"price":0.2422,"onOff":true,"start":"2022-01-17T11:00:00.000+01:00","saving":null},{"price":0.2422,"onOff":true,"start":"2022-01-17T12:00:00.000+01:00","saving":null},{"price":0.2427,"onOff":true,"start":"2022-01-17T13:00:00.000+01:00","saving":null},{"price":0.2417,"onOff":true,"start":"2022-01-17T14:00:00.000+01:00","saving":null},{"price":0.2416,"onOff":true,"start":"2022-01-17T15:00:00.000+01:00","saving":null},{"price":0.2412,"onOff":true,"start":"2022-01-17T16:00:00.000+01:00","saving":null},{"price":0.2379,"onOff":true,"start":"2022-01-17T17:00:00.000+01:00","saving":null},{"price":0.2366,"onOff":true,"start":"2022-01-17T18:00:00.000+01:00","saving":null},{"price":0.2397,"onOff":true,"start":"2022-01-17T19:00:00.000+01:00","saving":null},{"price":0.2387,"onOff":true,"start":"2022-01-17T20:00:00.000+01:00","saving":null},{"price":0.2414,"onOff":true,"start":"2022-01-17T21:00:00.000+01:00","saving":null},{"price":0.24,"onOff":true,"start":"2022-01-17T22:00:00.000+01:00","saving":null},{"price":0.2425,"onOff":true,"start":"2022-01-17T23:00:00.000+01:00","saving":null},{"price":0.2431,"onOff":true,"start":"2022-01-18T00:00:00.000+01:00","saving":null},{"price":0.2474,"onOff":true,"start":"2022-01-18T01:00:00.000+01:00","saving":null},{"price":0.2511,"onOff":true,"start":"2022-01-18T02:00:00.000+01:00","saving":null},{"price":0.2482,"onOff":true,"start":"2022-01-18T03:00:00.000+01:00","saving":null},{"price":0.247,"onOff":true,"start":"2022-01-18T04:00:00.000+01:00","saving":null},{"price":0.2412,"onOff":true,"start":"2022-01-18T05:00:00.000+01:00","saving":null},{"price":0.2486,"onOff":true,"start":"2022-01-18T06:00:00.000+01:00","saving":null},{"price":0.2474,"onOff":true,"start":"2022-01-18T07:00:00.000+01:00","saving":null},{"price":0.242,"onOff":true,"start":"2022-01-18T08:00:00.000+01:00","saving":null},{"price":0.2355,"onOff":true,"start":"2022-01-18T09:00:00.000+01:00","saving":null},{"price":0.2336,"onOff":true,"start":"2022-01-18T10:00:00.000+01:00","saving":null},{"price":0.2349,"onOff":true,"start":"2022-01-18T11:00:00.000+01:00","saving":null},{"price":0.2326,"onOff":true,"start":"2022-01-18T12:00:00.000+01:00","saving":null},{"price":0.2321,"onOff":true,"start":"2022-01-18T13:00:00.000+01:00","saving":null},{"price":0.2296,"onOff":true,"start":"2022-01-18T14:00:00.000+01:00","saving":null},{"price":0.2266,"onOff":true,"start":"2022-01-18T15:00:00.000+01:00","saving":null},{"price":0.2228,"onOff":true,"start":"2022-01-18T16:00:00.000+01:00","saving":null},{"price":0.2203,"onOff":true,"start":"2022-01-18T17:00:00.000+01:00","saving":null},{"price":0.2217,"onOff":true,"start":"2022-01-18T18:00:00.000+01:00","saving":null},{"price":0.2193,"onOff":true,"start":"2022-01-18T19:00:00.000+01:00","saving":null},{"price":0.2204,"onOff":true,"start":"2022-01-18T20:00:00.000+01:00","saving":null},{"price":0.2199,"onOff":false,"start":"2022-01-18T21:00:00.000+01:00","saving":0.0153},{"price":0.2108,"onOff":false,"start":"2022-01-18T22:00:00.000+01:00","saving":0.0062},{"price":0.2046,"onOff":true,"start":"2022-01-18T23:00:00.000+01:00","saving":null}],"source":"Tibber","config":{"maxHoursToSaveInSequence":"4","minHoursOnAfterMaxSequenceSaved":"1","minSaving":0.01,"sendCurrentValueWhenRescheduling":true,"outputIfNoSchedule":true},"sentOnCommand":false,"time":"2022-01-17T16:08:02.001+01:00","version":"3.2.3","current":true},"_msgid":"3a35789ffb5be37f"}';
// onMounted(() => {
//   convert(testData);
//   calculatePotentialSavings();
// });
</script>

<style scoped>
.config > p {
  margin: 0;
  padding: 0;
}

td,
th {
  margin: 2px 4px;
  padding: 2px 4px;
  font-size: small;
}

.highlightSequence {
  background-color: lightskyblue;
}

.highlightSaving {
  background-color: yellow;
}

.highlightBoth {
  background-color: lightgreen;
}

.belowMin {
  color: red;
}

.selectable {
  cursor: pointer;
}

.sepcol {
  background-color: darkgray;
}
</style>

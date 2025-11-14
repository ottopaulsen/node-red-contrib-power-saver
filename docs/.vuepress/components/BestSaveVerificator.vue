<template>
  <textarea rows="5" cols="80" name="rawData" placeHolder="Paste data here" v-model="dataString"></textarea>
  <p>{{ message }}</p>
  <div class="config" v-if="message === '' && payload.version">
    <h3>Config:</h3>
    <p>Max in sequence: {{ payload.config.maxHoursToSaveInSequence }}</p>
    <p>Min on after max: {{ payload.config.minHoursOnAfterMaxSequenceSaved }}</p>
    <p>Minimum saving: {{ payload.config.minSaving }}</p>
    <p>
      Send when rescheduling:
      {{ payload.config.sendCurrentValueWhenRescheduling ? "Yes" : "No" }}
    </p>
    <p>
      If no schedule, output:
      {{ payload.config.outputIfNoSchedule ? "On" : "Off" }}
    </p>
    <p>Context is saved to: {{ payload.config.contextStorage }}</p>
    <h3>Meta data:</h3>
    <p>Node version: {{ payload.version }}</p>
    <p>Data timestamp: {{ payload.time }}</p>
    <p>Price source: {{ payload.source }}</p>
    <p>Current output: {{ payload.current ? "On" : "Off" }}</p>
    <hr />
    <h3>Days:</h3>
    <table>
      <tr>
        <th>Date</th>
        <th v-tooltip="'Number of hours for the day'">Hours</th>
        <th v-tooltip="'Number of hours that are on'">Count on</th>
        <th v-tooltip="'Number of hours that are off'">Count off</th>
        <th v-tooltip="'Average price for the day'">Avg price</th>
        <th v-tooltip="'Number of hours that are turned off (saved)'">Count saved</th>
        <th v-tooltip="'Sum saved per kWh for the hours that are saved'">Sum saved</th>
        <th v-tooltip="'Sum saved / count saved'">Avg saved 1</th>
        <th v-tooltip="'Sum saved / Hours (whole day)'">Avg saved 2</th>
      </tr>
      <tr v-for="day in dayData" :key="day.date">
        <td>{{ day.date }}</td>
        <td>{{ day.countMinutes }}</td>
        <td>{{ day.countOn }}</td>
        <td>{{ day.countOff }}</td>
        <td>{{ day.avgPrice }}</td>
        <td>{{ day.countSaved }}</td>
        <td>{{ day.sumSaved }}</td>
        <td>{{ day.avgSaved1 }}</td>
        <td>{{ day.avgSaved2 }}</td>
      </tr>
    </table>

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
        <td>
          {{ DateTime.fromISO(hour.start).toFormat("HH:mm") }}
        </td>
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
import { computed, reactive, ref, watch } from "vue";
import { DateTime } from "luxon";

const message = ref("");
const showNegative = ref(false);

const show = ref("avg");
const showSum = computed(() => show.value === "sum");

function roundPrice(value) {
  return Math.round(value * 10000) / 10000;
}

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
  console.log("calculatePotentialSavings");
  console.log({ roundPrice });
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

// Daily data
const dayData = computed(() => {
  const hours = payload.hours;
  const dates = [...new Set(hours.map((h) => DateTime.fromISO(h.start).toISODate()))];
  const days = dates.map((d) => {
    return { date: d };
  });
  days.forEach((d) => {
    const dayHours = hours.filter((h) => DateTime.fromISO(h.start).toISODate() === d.date);
    d.countMinutes = dayHours.length;
    d.countOn = dayHours.filter((h) => h.onOff).length;
    d.countOff = dayHours.filter((h) => !h.onOff).length;
    d.countSaved = dayHours.filter((h) => h.saving !== null).length;
    d.avgPrice = roundPrice(
      dayHours.reduce((prev, h) => {
        return prev + h.price;
      }, 0.0) / d.countMinutes
    );
    d.sumSaved =
      d.countSaved > 0
        ? roundPrice(
            dayHours.reduce((prev, h) => {
              return prev + h.saving ?? 0;
            }, 0)
          )
        : null;
    d.avgSaved1 = d.countSaved > 0 ? roundPrice(d.sumSaved / d.countSaved) : null;
    d.avgSaved2 = d.countSaved > 0 ? roundPrice(d.sumSaved / d.countMinutes) : null;
  });
  return days;
});

// Event handlers

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

// Styling functions

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

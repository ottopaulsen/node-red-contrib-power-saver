<template>
  <textarea rows="5" cols="80" name="rawData" placeHolder="Paste data here" v-model="dataString"></textarea>
  <p>{{ message }}</p>
  <div class="config" v-if="message === '' && payload.version">
    <h3>Config:</h3>
    <p>Max minutes off: {{ payload.config.maxMinutesOff }}</p>
    <p>Min minutes off: {{ payload.config.minMinutesOff }}</p>
    <p>Recovery percentage: {{ payload.config.recoveryPercentage }}%</p>
    <p>Max recovery minutes: {{ payload.config.recoveryMaxMinutes }}</p>
    <p>Minimum saving: {{ payload.config.minSaving }}</p>
    <p>Output value for On: {{ payload.config.outputValueForOn }} ({{ payload.config.outputValueForOntype }})</p>
    <p>Output value for Off: {{ payload.config.outputValueForOff }} ({{ payload.config.outputValueForOfftype }})</p>
    <p>
      Send when rescheduling:
      {{ payload.config.sendCurrentValueWhenRescheduling ? "Yes" : "No" }}
    </p>
    <p>
      If no schedule, output:
      {{ payload.config.outputIfNoSchedule ? "On" : "Off" }}
    </p>
    <p>Context storage: {{ payload.config.contextStorage }}</p>
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
        <th v-tooltip="'Number of data points for the day'">Minutes</th>
        <th v-tooltip="'Number of minutes that are on'">Count on</th>
        <th v-tooltip="'Number of minutes that are off'">Count off</th>
        <th v-tooltip="'Average price for the day'">Avg price</th>
        <th v-tooltip="'Number of minutes that are turned off (saved)'">Count saved</th>
        <th v-tooltip="'Sum saved per kWh for the minutes that are saved'">Sum saved</th>
        <th v-tooltip="'Sum saved / count saved'">Avg saved 1</th>
        <th v-tooltip="'Sum saved / Minutes (whole day)'">Avg saved 2</th>
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

    <h3>Minutes:</h3>

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
        <th colspan="6">Input data</th>
        <th class="sepcol"></th>
        <th :colspan="visibleDifferenceColumns.length">Saving if turned off x minutes</th>
        <th class="sepcol"></th>
        <th :colspan="visibleSequenceColumns.length">Saving for sequence of x minutes</th>
      </tr>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Count</th>
        <th>Price</th>
        <th>On/Off</th>
        <th>Saving</th>
        <th class="sepcol"></th>
        <th v-for="col in visibleDifferenceColumns" :key="col.index">
          {{ col.label }}
        </th>
        <th class="sepcol"></th>
        <th v-for="col in visibleSequenceColumns" :key="col.index">
          {{ col.label }}
        </th>
      </tr>
      <tr v-for="(minute, i) in payload.minutes" :key="minute.start">
        <td>{{ DateTime.fromISO(minute.start).day }}</td>
        <td>
          {{ DateTime.fromISO(minute.start).toFormat("HH:mm:ss") }}
        </td>
        <td>{{ minute.count }}</td>
        <td :class="priceClasses(i)">{{ minute.price }}</td>
        <td>{{ minute.onOff ? "On" : "Off" }}</td>
        <td>{{ minute.saving ?? "" }}</td>
        <td class="sepcol"></td>
        <td v-for="col in visibleDifferenceColumns" :key="col.index" @click="showSavingSource(i, col.index)" :class="savingClasses(i, col.index)">
          {{ showNegative || differencePerMinute[i][col.index] > 0 ? differencePerMinute[i][col.index] : "" }}
        </td>
        <td class="sepcol"></td>
        <td
          v-for="col in visibleSequenceColumns"
          :key="col.index"
          @click="showSequenceSource(i, col.index)"
          :class="sequenceClasses(i, col.index)"
        >
          {{
            showNegative || totalPerSequence[i][col.index] > 0
              ? "" + (showSum ? totalPerSequence[i][col.index] : averagePerSequence[i][col.index])
              : ""
          }}
        </td>
      </tr>
      <tr v-if="visibleDifferenceColumns.length > 0 || visibleSequenceColumns.length > 0">
        <td colspan="6"><strong>Column count:</strong></td>
        <td class="sepcol"></td>
        <td v-for="col in visibleDifferenceColumns" :key="col.index">
          <strong>{{ col.count }}</strong>
        </td>
        <td class="sepcol"></td>
        <td v-for="col in visibleSequenceColumns" :key="col.index">
          <strong>{{ col.count }}</strong>
        </td>
      </tr>
    </table>

    <!-- Visual Chart -->
    <BestSaveChart :payload="payload" v-if="payload.minutes && payload.minutes.length > 0" />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { DateTime } from "luxon";
import BestSaveChart from './BestSaveChart.vue';

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

const differencePerMinute = reactive([]);
const differenceColumns = reactive([]);
const totalPerSequence = reactive([]);
const averagePerSequence = reactive([]);

function calculatePotentialSavings() {
  console.log("calculatePotentialSavings");
  console.log({ roundPrice });
  const minutes = payload.minutes;

  // Savings per minute block
  // Use maxMinutesOff to determine how many columns to show (convert to number)
  const maxColumns = parseInt(payload.config.maxMinutesOff) || 180;
  
  // Calculate total minutes across all blocks
  const totalMinutes = minutes.reduce((sum, m) => sum + m.count, 0);
  
  // Create columns based on actual minute counts, not just array indices
  const numColumns = Math.min(maxColumns, totalMinutes);
  for (let i = 0; i < numColumns; i++) {
    differenceColumns[i] = i + 1;
  }
  
  // For each minute block, calculate savings
  for (let i = 0; i < minutes.length; i++) {
    const row = reactive([]);
    const currentBlock = minutes[i];
    
    for (let j = 0; j < differenceColumns.length; j++) {
      const minutesAhead = j + 1;
      
      // Find the block that contains the minute we're comparing to
      let accumulatedMinutes = 0;
      let targetBlock = null;
      
      for (let k = i; k < minutes.length; k++) {
        accumulatedMinutes += minutes[k].count;
        if (accumulatedMinutes > minutesAhead) {
          targetBlock = minutes[k];
          break;
        }
      }
      
      row[j] = targetBlock ? roundPrice(currentBlock.price - targetBlock.price) : null;
    }
    differencePerMinute[i] = row;
  }

  // Savings per sequence
  for (let i = 0; i < minutes.length; i++) {
    const tot = reactive([]);
    const avg = reactive([]);
    
    for (let j = 0; j < differenceColumns.length; j++) {
      tot[j] = 0;
      for (let k = 0; k <= j; k++) {
        const val = i + k < minutes.length && differencePerMinute[i + k] && differencePerMinute[i + k][j - k] !== null 
          ? differencePerMinute[i + k][j - k] 
          : 0;
        tot[j] = roundPrice(tot[j] + val);
      }
      avg[j] = roundPrice(tot[j] / (j + 1));
      
      totalPerSequence[i] = tot;
      averagePerSequence[i] = avg;
    }
  }
}

// Daily data
const dayData = computed(() => {
  const minutes = payload.minutes;
  const dates = [...new Set(minutes.map((m) => DateTime.fromISO(m.start).toISODate()))];
  const days = dates.map((d) => {
    return { date: d };
  });
  days.forEach((d) => {
    const dayMinutes = minutes.filter((m) => DateTime.fromISO(m.start).toISODate() === d.date);
    
    // Sum up all the minutes using the count property
    d.countMinutes = dayMinutes.reduce((sum, m) => sum + m.count, 0);
    d.countOn = dayMinutes.filter((m) => m.onOff).reduce((sum, m) => sum + m.count, 0);
    d.countOff = dayMinutes.filter((m) => !m.onOff).reduce((sum, m) => sum + m.count, 0);
    d.countSaved = dayMinutes.filter((m) => m.saving !== null).reduce((sum, m) => sum + m.count, 0);
    
    // Calculate average price weighted by count
    const totalPrice = dayMinutes.reduce((prev, m) => {
      return prev + (m.price * m.count);
    }, 0.0);
    d.avgPrice = roundPrice(totalPrice / d.countMinutes);
    
    // Calculate sum saved weighted by count
    d.sumSaved =
      d.countSaved > 0
        ? roundPrice(
            dayMinutes.reduce((prev, m) => {
              return prev + ((m.saving ?? 0) * m.count);
            }, 0)
          )
        : null;
    d.avgSaved1 = d.countSaved > 0 ? roundPrice(d.sumSaved / d.countSaved) : null;
    d.avgSaved2 = d.countSaved > 0 ? roundPrice(d.sumSaved / d.countMinutes) : null;
  });
  return days;
});

// Optimize columns by hiding duplicates
function getVisibleColumns(dataArray) {
  if (!dataArray || dataArray.length === 0 || !differenceColumns.length) {
    return [];
  }
  
  const visible = [];
  let i = 0;
  
  while (i < differenceColumns.length) {
    const startCol = i;
    let count = 1;
    
    // Check if the next column has identical values to the current column across all rows
    while (i + count < differenceColumns.length) {
      let identical = true;
      
      // Compare column at (i + count - 1) with column at (i + count)
      for (let row = 0; row < dataArray.length; row++) {
        if (!dataArray[row]) {
          identical = false;
          break;
        }
        
        const val1 = dataArray[row][i + count - 1];
        const val2 = dataArray[row][i + count];
        
        // Handle null/undefined
        if (val1 !== val2) {
          identical = false;
          break;
        }
      }
      
      if (!identical) break;
      count++;
    }
    
    // Add the first column of the group with its count
    visible.push({
      index: startCol,
      label: count > 1 ? `${startCol + 1}-${startCol + count}` : `${startCol + 1}`,
      count: count
    });
    
    i += count;
  }
  
  return visible;
}

const visibleDifferenceColumns = computed(() => {
  return getVisibleColumns(differencePerMinute);
});

const visibleSequenceColumns = computed(() => {
  return getVisibleColumns(showSum.value ? totalPerSequence : averagePerSequence);
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

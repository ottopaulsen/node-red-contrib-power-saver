<template>
  <div class="savings-heatmap">
    <h3>Savings if Turned Off (Heatmap)</h3>
    <p class="explanation">
      Each colored cell shows the potential saving per kWh if turned off for that number of minutes.
      Click a cell to see which values were used in the calculation.
    </p>

    <div style="overflow-x: auto;">
      <svg :width="svgWidth" :height="svgHeight" class="heatmap-svg">
        <!-- Rows -->
        <g v-for="(minute, i) in minutes" :key="'row-' + i">
          <!-- Row label -->
          <text :x="5"
                :y="i * cellHeight + cellHeight / 2 + 4"
                class="row-label">
            {{ DateTime.fromISO(minute.start).toFormat("MM-dd HH:mm") }}
          </text>

          <!-- Heatmap cells -->
          <rect v-for="(col, j) in visibleColumns" 
                :key="'cell-' + i + '-' + j"
                :x="labelWidth + j * cellWidth"
                :y="i * cellHeight"
                :width="cellWidth"
                :height="cellHeight"
                :fill="getCellColor(i, j)"
                :stroke="getCellStroke(i, j)"
                :stroke-width="getCellStrokeWidth(i, j)"
                @click="handleCellClick(i, j)"
                class="heatmap-cell"
          />
        </g>

        <!-- Horizontal grid lines only (between rows) -->
        <line v-for="i in minutes.length + 1" :key="'h-line-' + i"
              :x1="labelWidth" :y1="(i - 1) * cellHeight"
              :x2="labelWidth + visibleColumns.length * cellWidth" 
              :y2="(i - 1) * cellHeight"
              stroke="#ddd" stroke-width="0.5" />
      </svg>
    </div>

    <div v-if="clickedCell.row !== null" class="cell-info">
      <h4>Cell Details</h4>
      <div class="detail-grid">
        <div class="detail-item"><span class="label">Row:</span> {{ clickedCell.row + 1 }}</div>
        <div class="detail-item"><span class="label">Column:</span> {{ clickedCell.col + 1 }} (turn off for {{ clickedCell.col + 1 }} minutes)</div>
        <div class="detail-item"><span class="label">Date:</span> {{ DateTime.fromISO(minutes[clickedCell.row].start).toFormat("yyyy-MM-dd") }}</div>
        <div class="detail-item"><span class="label">Time:</span> {{ DateTime.fromISO(minutes[clickedCell.row].start).toFormat("HH:mm") }}</div>
        <div class="detail-item"><span class="label">Count:</span> {{ minutes[clickedCell.row].count }} minutes</div>
        <div class="detail-item"><span class="label">Price:</span> {{ minutes[clickedCell.row].price }}</div>
        <div class="detail-item"><span class="label">On/Off:</span> {{ minutes[clickedCell.row].onOff ? 'On' : 'Off' }}</div>
        <div class="detail-item"><span class="label">Saving:</span> {{ minutes[clickedCell.row].saving ?? 'N/A' }}</div>
        <div class="detail-item"><span class="label">Value:</span> {{ getCellValue(clickedCell.row, clickedCell.col) }}</div>
        <div class="detail-item full-width"><span class="label">Period Start:</span> Row {{ periodInfo.start + 1 }} ({{ DateTime.fromISO(minutes[periodInfo.start].start).toFormat("MM-dd HH:mm") }})</div>
        <div class="detail-item full-width"><span class="label">Period End:</span> Row {{ periodInfo.end + 1 }} ({{ DateTime.fromISO(minutes[periodInfo.end].start).toFormat("MM-dd HH:mm") }})</div>
      </div>
      <div class="calculation">
        <strong>What this value means:</strong><br>
        This shows the saving per kWh if you turn off the power for <strong>{{ clickedCell.col + 1 }} minutes</strong> 
        starting at {{ DateTime.fromISO(minutes[clickedCell.row].start).toFormat("MM-dd HH:mm") }}.<br><br>
        <strong>Calculation:</strong><br>
        Price at row {{ clickedCell.row + 1 }} at {{ DateTime.fromISO(minutes[clickedCell.row].start).toFormat("MM-dd HH:mm") }}: 
        <strong>{{ minutes[clickedCell.row].price }}</strong><br>
        <span style="margin-left: 20px;">minus</span><br>
        <template v-if="getTargetRow() !== null">
          Price at row {{ getTargetRow() + 1 }} at {{ getTargetTime() }} (valid {{ clickedCell.col + 1 }} minutes later): 
          <strong>{{ getTargetPrice() }}</strong><br>
          <span style="margin-left: 20px;">=</span><br>
          Saving per kWh: <strong>{{ getCellValue(clickedCell.row, clickedCell.col) }}</strong>
        </template>
        <template v-else>
          <em>No target row found ({{ clickedCell.col + 1 }} minutes exceeds available data)</em>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { DateTime } from 'luxon';

const props = defineProps({
  minutes: {
    type: Array,
    required: true
  },
  differencePerMinute: {
    type: Array,
    required: true
  },
  differenceColumns: {
    type: Array,
    required: true
  },
  showNegative: {
    type: Boolean,
    default: false
  },
  maxColumns: {
    type: Number,
    required: true
  }
});

const clickedCell = reactive({ row: null, col: null });
const highlightedCells = ref(new Set());

// SVG dimensions
const labelWidth = 80;
const cellHeight = 18; // Fixed height for readability

// Computed cell width to fit page width
const cellWidth = computed(() => {
  // Use available width minus label width
  // Typically the page is ~1184px wide now, leave some margin
  const availableWidth = 1100 - labelWidth;
  const numColumns = props.maxColumns;
  return Math.floor(availableWidth / numColumns);
});

const visibleColumns = computed(() => {
  const cols = [];
  for (let i = 0; i < props.maxColumns; i++) {
    cols.push(i + 1);
  }
  return cols;
});

const svgWidth = computed(() => {
  return labelWidth + visibleColumns.value.length * cellWidth.value;
});

const svgHeight = computed(() => {
  return props.minutes.length * cellHeight;
});

// Find min/max for color scaling
const valueStats = computed(() => {
  let min = 0;
  let max = 0;
  
  for (let i = 0; i < props.differencePerMinute.length; i++) {
    for (let j = 0; j < props.maxColumns; j++) {
      const val = props.differencePerMinute[i]?.[j];
      if (val !== null && val !== undefined) {
        if (val > max) max = val;
        if (val < min) min = val;
      }
    }
  }
  
  return { min, max };
});

// Find period start and end (consecutive cells with same value)
const periodInfo = computed(() => {
  if (clickedCell.row === null || clickedCell.col === null) {
    return { start: 0, end: 0 };
  }
  
  const currentValue = props.differencePerMinute[clickedCell.row]?.[clickedCell.col];
  if (currentValue === null || currentValue === undefined) {
    return { start: clickedCell.row, end: clickedCell.row };
  }
  
  let start = clickedCell.row;
  let end = clickedCell.row;
  
  // Find start - go backward while values match
  while (start > 0 && props.differencePerMinute[start - 1]?.[clickedCell.col] === currentValue) {
    start--;
  }
  
  // Find end - go forward while values match
  while (end < props.minutes.length - 1 && props.differencePerMinute[end + 1]?.[clickedCell.col] === currentValue) {
    end++;
  }
  
  return { start, end };
});

function getCellValue(row, col) {
  const val = props.differencePerMinute[row]?.[col];
  return val !== null && val !== undefined ? val.toFixed(4) : 'N/A';
}

function getTargetRow() {
  const minutesAhead = clickedCell.col + 1;
  let accumulatedMinutes = 0;
  
  for (let k = clickedCell.row; k < props.minutes.length; k++) {
    accumulatedMinutes += props.minutes[k].count;
    if (accumulatedMinutes > minutesAhead) {
      return k;
    }
  }
  return null;
}

function getTargetPrice() {
  const targetRow = getTargetRow();
  if (targetRow !== null && targetRow < props.minutes.length) {
    return props.minutes[targetRow].price;
  }
  return 'N/A';
}

function getTargetTime() {
  const targetRow = getTargetRow();
  if (targetRow !== null && targetRow < props.minutes.length) {
    return DateTime.fromISO(props.minutes[targetRow].start).toFormat("MM-dd HH:mm");
  }
  return 'N/A';
}

function getCellColor(row, col) {
  const val = props.differencePerMinute[row]?.[col];
  
  if (val === null || val === undefined) {
    return 'white';
  }
  
  if (val > 0) {
    // Blue gradient for positive values
    const intensity = val / valueStats.value.max;
    const lightness = 90 - (intensity * 60); // 90% to 30%
    return `hsl(210, 100%, ${lightness}%)`;
  } else if (val < 0 && props.showNegative) {
    // Red gradient for negative values
    const intensity = Math.abs(val) / Math.abs(valueStats.value.min);
    const lightness = 90 - (intensity * 60); // 90% to 30%
    return `hsl(0, 100%, ${lightness}%)`;
  }
  
  return 'white';
}

function getCellStroke(row, col) {
  if (clickedCell.row === row && clickedCell.col === col) {
    return '#000';
  }
  if (highlightedCells.value.has(`${row},${col}`)) {
    return '#ff6b00';
  }
  return 'none';
}

function getCellStrokeWidth(row, col) {
  if (clickedCell.row === row && clickedCell.col === col) {
    return 3;
  }
  if (highlightedCells.value.has(`${row},${col}`)) {
    return 2;
  }
  return 0;
}

function handleCellClick(row, col) {
  clickedCell.row = row;
  clickedCell.col = col;
  
  // Highlight the source cell
  highlightedCells.value = new Set();
  highlightedCells.value.add(`${row},${col}`);
  
  // Highlight the cell being compared to (row + col + 1)
  const targetRow = row + col + 1;
  if (targetRow < props.minutes.length) {
    highlightedCells.value.add(`${targetRow},0`); // Mark the row
  }
}
</script>

<style scoped>
.savings-heatmap {
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.explanation {
  color: #555;
  margin: 10px 0 20px 0;
  line-height: 1.6;
}

.heatmap-svg {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.heatmap-cell {
  cursor: pointer;
  transition: opacity 0.2s;
}

.heatmap-cell:hover {
  opacity: 0.8;
}

.column-label {
  font-size: 10px;
  font-weight: bold;
  fill: #333;
}

.row-label {
  font-size: 11px;
  fill: #555;
}

.cell-info {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border: 2px solid #3498db;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cell-info h4 {
  margin: 0 0 15px 0;
  padding: 0;
  color: #2c3e50;
  font-size: 18px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px 16px;
  margin-bottom: 15px;
}

.detail-item {
  font-size: 14px;
  color: #555;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item .label {
  font-weight: 600;
  color: #2c3e50;
  margin-right: 4px;
}

.calculation {
  margin-top: 15px;
  padding: 12px;
  background: #ecf0f1;
  border-left: 4px solid #3498db;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
  color: #2c3e50;
}

.calculation strong {
  display: block;
  margin-bottom: 6px;
  color: #2c3e50;
}
</style>

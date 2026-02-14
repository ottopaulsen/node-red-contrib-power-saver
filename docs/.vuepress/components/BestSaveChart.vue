<template>
  <div class="best-save-chart" v-if="hasData">
    <h3>Visual Timeline</h3>
    
    <div class="chart-controls">
      <label>
        <input type="checkbox" v-model="showPrice" />
        Show price curve
      </label>
      <label>
        <input type="checkbox" v-model="showSavings" />
        Show savings
      </label>
      <label>
        <input type="checkbox" v-model="showRecovery" />
        Show recovery periods
      </label>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="legend-box on"></span> On (consuming power)</span>
      <span class="legend-item"><span class="legend-box off"></span> Off (saving)</span>
      <span class="legend-item"><span class="legend-box recovery"></span> Recovery period</span>
      <span class="legend-item" v-if="showSavings"><span class="legend-box savings-area"></span> Savings area</span>
    </div>

    <svg :width="chartWidth" :height="chartHeight" class="timeline-chart">
      <!-- Background grid -->
      <g class="grid">
        <line 
          v-for="i in gridLines" 
          :key="'grid-' + i"
          :x1="timeToX(i * 60)"
          :y1="margin.top"
          :x2="timeToX(i * 60)"
          :y2="chartHeight - margin.bottom"
          stroke="#e0e0e0"
          stroke-width="1"
          stroke-dasharray="2,2"
        />
      </g>

      <!-- On/Off state bars -->
      <g class="state-bars">
        <rect
          v-for="(block, i) in expandedBlocks"
          :key="'state-' + i"
          :x="block.x"
          :y="margin.top"
          :width="block.width"
          :height="chartHeight - margin.top - margin.bottom"
          :class="block.onOff ? 'state-on' : 'state-off'"
        />
      </g>

      <!-- Recovery period overlays -->
      <g v-if="showRecovery" class="recovery-bars">
        <rect
          v-for="(recovery, i) in recoveryPeriods"
          :key="'recovery-' + i"
          :x="recovery.x"
          :y="margin.top"
          :width="recovery.width"
          :height="chartHeight - margin.top - margin.bottom"
          class="state-recovery"
        />
      </g>

      <!-- Savings visualization as shaded area -->
      <g v-if="showSavings" class="savings-areas">
        <polygon
          v-for="(saving, i) in savingsVisualization"
          :key="'saving-area-' + i"
          :points="saving.areaPoints"
          fill="#555"
          opacity="0.2"
          stroke="none"
        />
      </g>

      <!-- Price line (drawn after savings so it's on top) -->
      <g v-if="showPrice" class="price-line">
        <polyline
          :points="priceLinePoints"
          fill="none"
          stroke="#2c3e50"
          stroke-width="2"
        />
      </g>

      <!-- X-axis time labels -->
      <g class="x-axis">
        <text
          v-for="hour in xAxisLabels"
          :key="'time-' + hour"
          :x="timeToX(hour * 60)"
          :y="chartHeight - margin.bottom + 20"
          text-anchor="middle"
          font-size="11"
        >
          {{ formatHour(hour) }}
        </text>
      </g>

      <!-- Y-axis price labels -->
      <g class="y-axis">
        <text
          v-for="(tick, i) in priceTicks"
          :key="'price-tick-' + i"
          :x="margin.left - 10"
          :y="priceToY(tick)"
          text-anchor="end"
          font-size="11"
          alignment-baseline="middle"
        >
          {{ tick.toFixed(2) }}
        </text>
      </g>

      <!-- Axis labels -->
      <text 
        :x="chartWidth / 2" 
        :y="chartHeight - 5" 
        text-anchor="middle"
        font-size="12"
        font-weight="bold"
      >
        Time (hours)
      </text>
      <text 
        :x="15" 
        :y="margin.top - 10" 
        font-size="12"
        font-weight="bold"
      >
        Price
      </text>
    </svg>

    <!-- Statistics summary -->
    <div class="stats-summary">
      <div class="stat-box">
        <div class="stat-label">Total Time</div>
        <div class="stat-value">{{ totalMinutes }} min</div>
      </div>
      <div class="stat-box on">
        <div class="stat-label">Time On</div>
        <div class="stat-value">{{ totalOnMinutes }} min ({{ onPercentage }}%)</div>
      </div>
      <div class="stat-box off">
        <div class="stat-label">Time Off</div>
        <div class="stat-value">{{ totalOffMinutes }} min ({{ offPercentage }}%)</div>
      </div>
      <div class="stat-box savings">
        <div class="stat-label">Avg Saving per kWh</div>
        <div class="stat-value">{{ avgSavingsPerKwh }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Avg Price</div>
        <div class="stat-value">{{ avgPrice }}</div>
      </div>
    </div>

    <!-- OFF Sequence Savings -->
    <div class="sequence-savings" v-if="offSequenceSavings.length > 0">
      <h4>Savings per OFF Sequence</h4>
      <table>
        <thead>
          <tr>
            <th>Sequence</th>
            <th>Duration</th>
            <th>Avg Saving per kWh</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(seq, i) in offSequenceSavings" :key="'seq-' + i">
            <td>{{ i + 1 }}</td>
            <td>{{ seq.durationMinutes }} minutes</td>
            <td>{{ seq.avgSavingPerKwh }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Schedule periods -->
    <div class="schedule-info">
      <h4>Schedule Periods</h4>
      <table>
        <thead>
          <tr>
            <th>Start Time</th>
            <th>Duration</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(period, i) in schedule" :key="'period-' + i">
            <td>{{ formatTime(period.time) }}</td>
            <td>{{ period.countMinutes }} minutes</td>
            <td :class="period.value ? 'on-text' : 'off-text'">
              {{ period.value ? 'ON' : 'OFF' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { DateTime } from 'luxon';

const props = defineProps({
  payload: {
    type: Object,
    required: true
  }
});

const showPrice = ref(true);
const showSavings = ref(true);
const showRecovery = ref(true);

const chartWidth = 1000;
const chartHeight = 400;
const margin = { top: 50, right: 30, bottom: 60, left: 60 };

const hasData = computed(() => {
  return props.payload && props.payload.minutes && props.payload.minutes.length > 0;
});

// Calculate total minutes across all blocks
const totalMinutes = computed(() => {
  if (!hasData.value) return 0;
  return props.payload.minutes.reduce((sum, m) => sum + m.count, 0);
});

const totalOnMinutes = computed(() => {
  if (!hasData.value) return 0;
  return props.payload.minutes.filter(m => m.onOff).reduce((sum, m) => sum + m.count, 0);
});

const totalOffMinutes = computed(() => {
  if (!hasData.value) return 0;
  return props.payload.minutes.filter(m => !m.onOff).reduce((sum, m) => sum + m.count, 0);
});

const onPercentage = computed(() => {
  if (totalMinutes.value === 0) return 0;
  return Math.round((totalOnMinutes.value / totalMinutes.value) * 100);
});

const offPercentage = computed(() => {
  if (totalMinutes.value === 0) return 0;
  return Math.round((totalOffMinutes.value / totalMinutes.value) * 100);
});

const avgSavingsPerKwh = computed(() => {
  if (!hasData.value) return '0.00';
  const offBlocks = props.payload.minutes.filter(m => !m.onOff && m.saving !== null);
  if (offBlocks.length === 0) return '0.00';
  
  const totalWeighted = offBlocks.reduce((total, m) => {
    return total + (m.saving * m.count);
  }, 0);
  const totalOffMinutes = offBlocks.reduce((total, m) => total + m.count, 0);
  
  return totalOffMinutes > 0 ? (totalWeighted / totalOffMinutes).toFixed(4) : '0.00';
});

// Calculate average saving per kWh for each OFF sequence
const offSequenceSavings = computed(() => {
  if (!hasData.value) return [];
  
  const sequences = [];
  let i = 0;
  
  while (i < props.payload.minutes.length) {
    const block = props.payload.minutes[i];
    
    if (!block.onOff) {
      let totalMinutes = 0;
      let weightedSavings = 0;
      let sequenceStart = i;
      
      // Accumulate consecutive OFF blocks
      while (i < props.payload.minutes.length && !props.payload.minutes[i].onOff) {
        const offBlock = props.payload.minutes[i];
        totalMinutes += offBlock.count;
        weightedSavings += (offBlock.saving ?? 0) * offBlock.count;
        i++;
      }
      
      const avgSaving = totalMinutes > 0 ? weightedSavings / totalMinutes : 0;
      
      sequences.push({
        startIndex: sequenceStart,
        durationMinutes: totalMinutes,
        avgSavingPerKwh: avgSaving.toFixed(4)
      });
    } else {
      i++;
    }
  }
  
  return sequences;
});

const avgPrice = computed(() => {
  if (!hasData.value) return '0.00';
  const totalPrice = props.payload.minutes.reduce((sum, m) => sum + (m.price * m.count), 0);
  return (totalPrice / totalMinutes.value).toFixed(4);
});

const schedule = computed(() => props.payload.schedule || []);

// Expand blocks into time-based coordinates
const expandedBlocks = computed(() => {
  if (!hasData.value) return [];
  
  let currentMinute = 0;
  return props.payload.minutes.map((block, index) => {
    const startMinute = currentMinute;
    const endMinute = currentMinute + block.count;
    currentMinute = endMinute;
    
    return {
      x: timeToX(startMinute),
      width: timeToX(endMinute) - timeToX(startMinute),
      onOff: block.onOff,
      saving: block.saving,
      price: block.price,
      startMinute,
      endMinute,
      index
    };
  });
});

// Calculate recovery periods
const recoveryPeriods = computed(() => {
  if (!hasData.value || !props.payload.config) return [];
  
  const recoveryPercentage = parseInt(props.payload.config.recoveryPercentage) || 50;
  const recoveryMaxMinutes = parseInt(props.payload.config.recoveryMaxMinutes) || 120;
  
  const periods = [];
  
  // First, build an array with cumulative minute positions
  const blockPositions = [];
  let cumulativeMinute = 0;
  for (let i = 0; i < props.payload.minutes.length; i++) {
    blockPositions.push({
      startMinute: cumulativeMinute,
      endMinute: cumulativeMinute + props.payload.minutes[i].count,
      block: props.payload.minutes[i]
    });
    cumulativeMinute += props.payload.minutes[i].count;
  }
  
  // Find consecutive OFF sequences and calculate recovery for each
  let i = 0;
  while (i < blockPositions.length) {
    const position = blockPositions[i];
    
    // If this is the start of an OFF sequence, accumulate all consecutive OFF blocks
    if (!position.block.onOff) {
      let totalOffDuration = 0;
      let offSequenceEnd = i;
      
      // Sum up all consecutive OFF blocks
      while (offSequenceEnd < blockPositions.length && !blockPositions[offSequenceEnd].block.onOff) {
        totalOffDuration += blockPositions[offSequenceEnd].block.count;
        offSequenceEnd++;
      }
      
      // Calculate recovery based on TOTAL consecutive OFF time
      const recoveryDuration = Math.min(
        Math.round(totalOffDuration * recoveryPercentage / 100),
        recoveryMaxMinutes
      );
      
      if (recoveryDuration > 0) {
        let remainingRecovery = recoveryDuration;
        
        // Apply recovery to subsequent ON blocks
        for (let j = offSequenceEnd; j < blockPositions.length && remainingRecovery > 0; j++) {
          const futurePosition = blockPositions[j];
          
          if (futurePosition.block.onOff) {
            // This is an ON block, include it in recovery
            const recoveryInThisBlock = Math.min(remainingRecovery, futurePosition.block.count);
            
            periods.push({
              x: timeToX(futurePosition.startMinute),
              width: timeToX(futurePosition.startMinute + recoveryInThisBlock) - timeToX(futurePosition.startMinute),
              duration: recoveryInThisBlock
            });
            
            remainingRecovery -= recoveryInThisBlock;
          } else {
            // Hit another OFF block, stop recovery
            break;
          }
        }
      }
      
      // Skip to the end of this OFF sequence
      i = offSequenceEnd;
    } else {
      i++;
    }
  }
  
  return periods;
});

// Savings visualization: shaded area during OFF period showing savings
const savingsVisualization = computed(() => {
  if (!hasData.value || !props.payload.config) return [];
  
  const recoveryPercentage = parseInt(props.payload.config.recoveryPercentage) || 50;
  const recoveryMaxMinutes = parseInt(props.payload.config.recoveryMaxMinutes) || 120;
  
  const visualizations = [];
  
  // Build position map
  const blockPositions = [];
  let cumulativeMinute = 0;
  for (let i = 0; i < props.payload.minutes.length; i++) {
    blockPositions.push({
      startMinute: cumulativeMinute,
      endMinute: cumulativeMinute + props.payload.minutes[i].count,
      block: props.payload.minutes[i]
    });
    cumulativeMinute += props.payload.minutes[i].count;
  }
  
  // Find consecutive OFF sequences
  let i = 0;
  while (i < blockPositions.length) {
    const position = blockPositions[i];
    
    if (!position.block.onOff) {
      let totalOffDuration = 0;
      let offSequenceEnd = i;
      let offSequenceStart = i;
      
      // Sum up all consecutive OFF blocks
      while (offSequenceEnd < blockPositions.length && !blockPositions[offSequenceEnd].block.onOff) {
        totalOffDuration += blockPositions[offSequenceEnd].block.count;
        offSequenceEnd++;
      }
      
      // Calculate recovery duration based on TOTAL consecutive OFF time
      const recoveryDuration = Math.min(
        Math.round(totalOffDuration * recoveryPercentage / 100),
        recoveryMaxMinutes
      );
      
      if (recoveryDuration > 0) {
        // Calculate average price during recovery period
        let recoveryMinutesAccumulated = 0;
        let weightedPriceSum = 0;
        
        for (let j = offSequenceEnd; j < blockPositions.length && recoveryMinutesAccumulated < recoveryDuration; j++) {
          const futurePosition = blockPositions[j];
          
          if (futurePosition.block.onOff) {
            const minutesInRecovery = Math.min(
              recoveryDuration - recoveryMinutesAccumulated,
              futurePosition.block.count
            );
            weightedPriceSum += futurePosition.block.price * minutesInRecovery;
            recoveryMinutesAccumulated += minutesInRecovery;
          } else {
            break;
          }
        }
        
        const avgRecoveryPrice = recoveryMinutesAccumulated > 0 
          ? weightedPriceSum / recoveryMinutesAccumulated 
          : null;
        
        if (avgRecoveryPrice !== null) {
          // Build the shaded area polygon over the OFF period
          // Top edge: step function following price curve during OFF
          // Bottom edge: average recovery price (horizontal line)
          const points = [];
          
          // Add top edge points (step function for price curve during OFF period)
          for (let j = offSequenceStart; j < offSequenceEnd; j++) {
            const offPosition = blockPositions[j];
            const startX = timeToX(offPosition.startMinute);
            const endX = timeToX(offPosition.endMinute);
            const priceY = priceToY(offPosition.block.price);
            
            // Create flat horizontal line for this block
            points.push(`${startX},${priceY}`);
            points.push(`${endX},${priceY}`);
          }
          
          // Add bottom edge points (average recovery price - horizontal line, in reverse)
          const avgRecoveryY = priceToY(avgRecoveryPrice);
          const offEndX = timeToX(blockPositions[offSequenceEnd - 1].endMinute);
          const offStartX = timeToX(blockPositions[offSequenceStart].startMinute);
          
          points.push(`${offEndX},${avgRecoveryY}`);
          points.push(`${offStartX},${avgRecoveryY}`);
          
          visualizations.push({
            areaPoints: points.join(' ')
          });
        }
      }
      
      i = offSequenceEnd;
    } else {
      i++;
    }
  }
  
  return visualizations;
});

// Price data points - create step function
const pricePoints = computed(() => {
  if (!hasData.value) return [];
  
  const points = [];
  let currentMinute = 0;
  
  for (let i = 0; i < props.payload.minutes.length; i++) {
    const block = props.payload.minutes[i];
    const startX = timeToX(currentMinute);
    const endX = timeToX(currentMinute + block.count);
    const y = priceToY(block.price);
    
    // Add start and end points for flat line
    points.push({ x: startX, y: y, price: block.price });
    points.push({ x: endX, y: y, price: block.price });
    
    currentMinute += block.count;
  }
  
  return points;
});

const priceLinePoints = computed(() => {
  return pricePoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

// Price range for Y-axis
const minPrice = computed(() => {
  if (!hasData.value) return 0;
  return Math.min(...props.payload.minutes.map(m => m.price));
});

const maxPrice = computed(() => {
  if (!hasData.value) return 1;
  return Math.max(...props.payload.minutes.map(m => m.price));
});

const priceTicks = computed(() => {
  const min = minPrice.value;
  const max = maxPrice.value;
  const range = max - min;
  const step = range / 5;
  return [min, min + step, min + 2*step, min + 3*step, min + 4*step, max];
});

// Calculate appropriate grid lines (every few hours)
const gridLines = computed(() => {
  const totalHours = Math.ceil(totalMinutes.value / 60);
  const step = totalHours > 48 ? 6 : totalHours > 24 ? 3 : 1;
  const lines = [];
  for (let i = step; i < totalHours; i += step) {
    lines.push(i);
  }
  return lines;
});

// Calculate appropriate x-axis labels
const xAxisLabels = computed(() => {
  const totalHours = Math.ceil(totalMinutes.value / 60);
  const step = totalHours > 72 ? 12 : totalHours > 48 ? 6 : totalHours > 24 ? 3 : 2;
  const labels = [0];
  for (let i = step; i <= totalHours; i += step) {
    labels.push(i);
  }
  return labels;
});

// Coordinate conversion functions
function timeToX(minutes) {
  const plotWidth = chartWidth - margin.left - margin.right;
  return margin.left + (minutes / totalMinutes.value) * plotWidth;
}

function priceToY(price) {
  const plotHeight = chartHeight - margin.top - margin.bottom;
  const priceRange = maxPrice.value - minPrice.value;
  if (priceRange === 0) return margin.top + plotHeight / 2;
  const normalized = (price - minPrice.value) / priceRange;
  return margin.top + plotHeight - (normalized * plotHeight);
}

function formatHour(hour) {
  return hour.toString().padStart(2, '0') + ':00';
}

function formatTime(timeStr) {
  return DateTime.fromISO(timeStr).toFormat('yyyy-MM-dd HH:mm');
}
</script>

<style scoped>
.best-save-chart {
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.chart-controls {
  margin: 15px 0;
}

.chart-controls label {
  margin-right: 20px;
  cursor: pointer;
}

.legend {
  margin: 15px 0;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-box {
  width: 30px;
  height: 20px;
  border: 1px solid #333;
  display: inline-block;
}

.legend-box.on {
  background-color: rgba(76, 175, 80, 0.3);
}

.legend-box.off {
  background-color: rgba(244, 67, 54, 0.3);
}

.legend-box.recovery {
  background-color: rgba(255, 152, 0, 0.4);
}

.legend-box.savings-area {
  background-color: rgba(85, 85, 85, 0.3);
  border: 2px solid #555;
}

.legend-line.savings {
  width: 30px;
  height: 4px;
  background-color: #555;
  display: inline-block;
}

.timeline-chart {
  display: block;
  margin: 20px auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.state-on {
  fill: rgba(76, 175, 80, 0.3);
  stroke: #4caf50;
  stroke-width: 1;
}

.state-off {
  fill: rgba(244, 67, 54, 0.3);
  stroke: #f44336;
  stroke-width: 1;
}

.state-recovery {
  fill: rgba(255, 152, 0, 0.4);
  stroke: #ff9800;
  stroke-width: 2;
  stroke-dasharray: 4,4;
}

.stats-summary {
  display: flex;
  gap: 15px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.stat-box {
  flex: 1;
  min-width: 150px;
  padding: 15px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  text-align: center;
}

.stat-box.on {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.stat-box.off {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.stat-box.savings {
  border-color: #ff9800;
  background: rgba(255, 152, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
  text-transform: uppercase;
  font-weight: bold;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.sequence-savings {
  margin-top: 30px;
}

.sequence-savings h4 {
  margin-bottom: 10px;
}

.sequence-savings table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.sequence-savings th,
.sequence-savings td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.sequence-savings th {
  background: #f0f0f0;
  font-weight: bold;
}

.schedule-info {
  margin-top: 30px;
}

.schedule-info h4 {
  margin-bottom: 10px;
}

.schedule-info table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.schedule-info th,
.schedule-info td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.schedule-info th {
  background: #f0f0f0;
  font-weight: bold;
}

.on-text {
  color: #4caf50;
  font-weight: bold;
}

.off-text {
  color: #f44336;
  font-weight: bold;
}
</style>

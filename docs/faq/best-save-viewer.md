---
sidebar: auto
---

# Best Save Viewer

::: danger WIP
The viewer tool is work in progress.
It give some useful information, but not all is correct.
Use with care.
:::

## Tool

Below is a tool you can use to look at how the Best Save node is working.
In order to use it, you must copy the payload from output 3 on the node:

![Copy payload](../images/copy-payload-best-save.png)

Then paste it here and see the result below:

<BestSaveVerificator/>

###



## Explanation

### Config

This is the configuration you have used in the Best Save node:
- **Max minutes off**: Maximum number of consecutive minutes the output can be off
- **Min minutes off**: Minimum number of minutes to remain off once turned off
- **Recovery percentage**: Percentage of the actual minutes off that must be "on" before allowing another off sequence
- **Max recovery minutes**: Maximum time for recovery period
- **Minimum saving**: The minimum saving per kWh required to turn off
- **Output values**: The actual values sent for On and Off states
- **Send when rescheduling**: Whether to send output when schedule changes
- **If no schedule, output**: Default output when no price data is available
- **Context storage**: Where the node stores its state

### Meta data

Other information about the calculation:
- **Node version**: The version of the node that generated the data
- **Data timestamp**: Time the data was handled by the Best Save node
- **Price source**: Where the price data comes from (e.g., Tibber, Nordpool)
- **Current output**: The current state (On or Off)

### Days

Here you can see summary statistics for each date in the data set. Hover over the column titles for explanations.
The statistics include total minutes, minutes on/off, average price, and savings metrics.

### Minutes

Here is your data represented in time blocks, as well as potential savings calculated by the tool. 

**Note**: The data is aggregated into blocks where consecutive minutes with the same price are grouped together. Each row shows the start time, the number of minutes in that block (Count), and the price for that period.

Negative numbers are hidden by default, but you can select to show them using the checkbox.

#### Input data

This is the time-series data used as input:
- **Date/Time**: When the block starts
- **Count**: How many consecutive minutes this block represents
- **Price**: The price per kWh for this period
- **On/Off**: Whether the output is on or off during this period
- **Saving**: How much is saved per kWh during this period (if off)

#### Saving if turned off x minutes

These columns show how much you will save per kWh by turning off for `x` minutes starting at that time block. 
The value is the difference between the price at that time and the price `x` minutes later. 

Click on a cell to highlight the cells used in the calculation.

**Column optimization**: When multiple consecutive columns have identical values across all rows, only the first column is shown with a range label (e.g., "1-5" means columns 1 through 5 have the same values). The footer row shows how many columns each visible column represents.

#### Saving for sequence of x minutes

These columns show how much you can save per kWh on average by turning off a sequence of `x` minutes starting at that time block. 

Click on a cell to highlight the cells used in the calculation.

Above the table you can select to see the **average per minute** or the **sum for all saved minutes**.

- **Red numbers**: The average saving is less than the configured "Minimum saving" threshold, so this sequence will not be used
- **Black numbers**: The sequence meets the minimum saving requirement and could be used if all other criteria are satisfied

**Column optimization**: Like the previous section, duplicate columns are collapsed to reduce clutter.

###



## Something seems wrong

The tool is not using the same code as the node, so in case there is a bug in the node (or in the tool) the numbers may not match.

<hr/>

<DonateButtons/>

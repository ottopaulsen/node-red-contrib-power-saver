# Capacity part of grid tariff

I Norway, there has been introduced a monthly fee for grid capacity. The purpose is to get people to avoid using large capacities at any time.
The fee is calculated based on the average consumption per hour. The maximum average consumption for each day is calculated. Then the average of the three highest days for the month is used to decide your capacity fee.

The capacity is divided in steps, so if your average of the 3 worst days is over the step limit, your fee is picked from that step.

Here is an example how this can be controlled. The axample contains several features, and yuo may not want to use them all, so it is a good idea to read through it all before you decide how to use it.

## Requirements

You need the following to be able to use this example:

- Tibber Pulse to measure consumption continuously.
- Tibber subscription to get consumption data per hour.
- Token to access Tibber API.
- [Node-RED Companion Integration](https://github.com/zachowj/hass-node-red)
- Tibber nodes in Node-RED.

If you have the same information from other sources, you may be able to adapt the example.

## Features

- Show status as Ok, Warning or Alarm for the current consumption (estimate calculated for the current hour).
- Show current step, that is the step that you already are on based on consumption previously this month.
- Control sensors in HA that you can use to take action to reduce consumption the current hour.

## Algorithm

The algorithm is calculating a state that can be:

- Ok - Current estimate will not bring you over to another step.
- Warning - Current estimate may affect the step, if combined with high consumption later this month.
- Alarm - Current estimate will bring you over to another step.

The current consumption is measured continuously (every 2 seconds), along with the total consumption for the current hour until current time.
The consumption for the rest of the current hour is estimated, assumed to be the same in average as the average consumption for the last minute (can be configured to several minutes). Based on this, the total consumption for the current hour is estimated.

Then the current hour is compared to the other hours today. If it is not the worst, status is Ok, as it will not affect the fee.

If the current hour is todays worst, it is ranked together with the other days this month. If today is ranked as 4 or better, where 1 is the worst this month, then status is Ok. It will not affect the fee.

The `currentStep` is decided based on the 3 worst days, including today, but not considering the current hour.

If today is ranked as 1, 2 or 3, it may affect the fee. Then the average of the three worst days, including this hour, is calculated. This is `currentMonthlyEstimate`. So, if the current hour is ranked as 3, and the `currentMonthlyEstimate` is still within `currentStep`, status is still Ok, as the current hour will not participate in braking the step limit.

If today is ranked as 1, 2 or 3, and the `currentMonthlyEstimate` is over the `currentStep`, then the status is Alarm.

Else the status is Warning. That is if today is ranked as 1 or 2, but `currentMonthlyEstimate` is still under `currentStep`. In this case, the current hour makes the situation worse, and can potentially participate in breaking the limit together with a worse hour coming later this month.

## Output

The last step in the flow provides the following output:

| Name                   | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| status                 | The status of the current hour (Ok, Warning or Alarm).                   |
| highestPerDay          | An array with the worst hour for each day this month                     |
| highestCounting        | An array with the 3 worst days this month, including passed hours today. |
| highestToday           | The worst hour until now today, not including current hour.              |
| currentMonthlyEstimate | The average of the three worst days, including this hour.                |
| hourEstimate           | The estimate for the current hour.                                       |
| currentStep            | The upper limit of the step we are currently on.                         |
| currentHourRanking     | The rank of the current hour, from 0 to 4. See below.                    |

### currentHourRanking

The current hour ranking has the following meaning:

| Value | Description                                                                        |
| ----- | ---------------------------------------------------------------------------------- |
| 0     | Not counting, since there has been another hour earlier today that is higher.      |
| 1     | This is estimated to be the worst hour in the month.                               |
| 2     | This is estimated to be the second worst hour in the month.                        |
| 3     | This is estimated to be the third worst hour in the month.                         |
| 4     | This hour is estimated to be the worst today, but not one of the top 3 this month. |

::: warning
The highest value here, 4, is based on the value of `MAX_COUNTING` in the `Find highest per day` node.
If you change `MAX_COUNTING`, the values here will also change.
:::

### alarmLevel TODO

| Value | Description                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------- |
| 0     | There is nothing to worry about.                                                                                            |
| 1     | The estimate for the current hour sets this as the second to worst hour this month, but it is still way under the next step |
| 2     | The estimate for the current hour sets this as the worst hour this month, but it is still way under the next step           |
| 3     | The estimate for the current hour is close to the limit for the next step                                                   |
| 4     | The estimate for the current hour is very close to the limit for the next step                                              |
| 5     | The estimate for the current hour is over the limit for the next step                                                       |
| 6     | The estimate for the current hour is way over the limit for the next step                                                   |
| 6     | This hour increases the estimate for the month                                                                              |

hourEstimate
maxToday
highestCounting (1, 2, 3)
highestCountingAverage
nextStep

hourEstimate < maxToday
hourEstimate > maxToday && hourEstimate < highestCounting[2]
maxToday < hourEstimate < nextStep
maxToday < hourEstimate < highestCounting[2]
maxToday < hourEstimate < highestCounting[1]
maxToday < hourEstimate < highestCounting[0]

You can define the limits for `close` and `very close` to the next step, and the limit for `way over` the next step.

If the current hour is

## Node description

### Get live data

This is a `tibber-feed` node. It sets up a subscription of live Tibber data from Tibber Pulse, and uses this data to run the automation. Tick the following check boxes:

- Timestamp
- Power
- Accumulated consumption
- Accumulated consumption last hour

Uncheck all the others.

If you do not use Tibber, but can get this information from another source, convert it to the following format and use it the same way as data from this node is used:

```json
{
  "timestamp": "2022-06-12T14:42:00.000+02:00",
  "power": 9503,
  "accumulatedConsumption": 33.459665,
  "accumulatedConsumptionLastHour": 7.046665
}
```

### Build query for consumption

This is a function node that is used to build a Tibber query. It runs for all the live data, takes the time and calculates how many hours there has been since the beginning of the month. It uses this number to build a Tibber query to get consumption per hour since the beginning of the month. It sends output only when first started and when the hour changes, so it initiates a Tibber query once per hour.

::: warning Tibber Home Id
This node needs the tibber home id, so you must find it in the [Tibber Developer Pages](https://developer.tibber.com/) and set the vale of `TIBBER_HOME_ID` in the beginning of the code.
:::

### Get consumption

This is a `tibber-query` node used to get consumption per hour for passed hours. It takes a Tibber query as input, and sends the result as output. The query is built by the previous node.

If you do not use Tibber, but can get this information from another source, convert it to the following format and use it the same way as data from this node is used:

```json
{
  "viewer": {
    "home": {
      "consumption": {
        "nodes": [
          {
            "from": "2022-06-01T00:00:00.000+02:00",
            "consumption": 4.307
          },
          {
            "from": "2022-06-01T01:00:00.000+02:00",
            "consumption": 3.648
          },
          {
            "from": "2022-06-01T02:00:00.000+02:00",
            "consumption": 2.406
          },
          // ...
          {
            "from": "2022-06-12T12:00:00.000+02:00",
            "consumption": 0.969
          },
          {
            "from": "2022-06-12T13:00:00.000+02:00",
            "consumption": 7.612
          }
        ]
      }
    }
  }
}
```

It must contain data for every hour from the beginning of the month until the last complete hour.

### Collect estimate for hour

This is a function node that receives all the live data and estimates the consumption for the rest of the current hour. It sums up the actual consumption from the beginning of the hour until the current time, and adds the estimate for the rest of the hour, giving a total estimate for the hour.

In the beginning of the code, there is a constant `ESTIMATION_TIME_MINUTES` that you can use to decide how many minutes that is used
to calculate assumed average consumption.

The function keeps a buffer with all readings for the last period of length given with `ESTIMATION_TIME_MINUTES`.
It uses this buffer to calculate the average consumption for the period. It uses the result and estimates the consumption for the rest of the hour, assuming that the consumption will be the same.

As outputs it sends the following:

| Name                   | Description                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| accumulatedConsumption | Accumulated consumption the current day.                                                                                             |
| periodSec              | Period the average is calculated for, in seconds. It will increase in the beginning, until it reaches `ESTIMATION_TIME_MINUTES * 60` |
| consumptionInPeriod    | Consumption in the last `periodSec` seconds. Used as estimate for the remaining of the hour.                                         |
| timeLeftSec            | Number of seconds left in the current hour.                                                                                          |
| consumptionLeft        | Estimated consumption the remaining of the hour.                                                                                     |
| hourEstimate           | The estimated consumption for the total hour.                                                                                        |

### Find highest per day

Based on the result from the tibber query, gives the following output:

| Name                   | Description                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| highestPerDay          | The highest hour for each day until now this month, including current day.                                                    |
| highestCounting        | The 3 highest days current month. Can be other than 3 by changing the `MAX_COUNTING` constant in the beginning of the script. |
| highestToday           | The highest hour that has ended until now this day.                                                                           |
| currentMonthlyEstimate | The average of the 3 highest days until now this month. That is the capacity that will be used unless it is increased.        |

Output is sent when the query is run, that is on startup and when the hour changes.

### Check for breach

This is where numbers are evaluated to figure out if the current hour is in risk of breaching the limit for the next step.
The output is as follows:

| Name                   | Description                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------- |
| status                 | The status of the current hour (Ok, Warning or Alarm).                              |
| highestPerDay          | An array with the worst hour for each day this month                                |
| highestCounting        | An array with the 3 worst days this month, including passed hours today.            |
| highestToday           | The worst hour until now today, not including current hour.                         |
| currentMonthlyEstimate | The average of the three worst days, including this hour.                           |
| hourEstimate           | The estimate for the current hour.                                                  |
| currentStep            | The upper limit of the step we are currently on.                                    |
| currentHourRanking     | The rank of the current hour, from 1 to 4, where 4 is the lowest                    |
| reductionRequired      | The power that must be reduced the rest of the hour in order to not break the limit |

## Actions

You may set up actions to be taken when the status is Warning or Alarm.
For each action, specify priority and expected reduction in kW,
as well as what data to send as output for that action.

When a warning or an alarm has been on for a specified time, actions are taken.
Actions are taken in prioritized order, until enough reduction is expected,
so multiple actions may be taken at the same time.

Actions are defined in an array in the beginning of the script.
The first action has highest priority, that is it will be executed first.
The rest follow in prioritized order.

For each action, the following is specified:

- sensor - The the entity id of the sensor that gives you the effect that will be reduced.
- outputActivate - The data sent to the output to acticate the action.
- outputDeactivate - The data sent to the output to deactivate the action.
- activateOnWarning - true if this shall be activated on warning.

The node has the same number of outputs as there are actions.
The first output is for the first action, and so on.
When an action is activated, the outputActivate data is sent to the corresponding output.
When the hour is over, the action is deactivated.
When an action is deativated, the outputDeactivate data is sent to the corresponding output.

It is up to you to define how to use the actions.

# TO DO

- Implement actions
- Make a safety margin in kW so we reduce a little more than necessary.
- May need some kind of warning when hourEstimate > currentStep, even if currentMonthlyEstimate is not.
- Maybe set reductionRequired to hourEstimate - currentStep in this case.

---
next: ./ps-receive-price.md
---

# ps-strategy-lowest-price

![ps-strategy-lowest-price](../images/node-ps-strategy-lowest-price.png)

Strategy node to turn on power the hours when the price is lowest during a given period, and turn off the other hours.

## Description

The node can work on a specific period from 1 to 24 hours during a 24 hour period. Inside this period, you can decide how many hours that shall be on. The rest of the period will be off. Outside the peiod, you can select that the output shall be either on or off. You can also decide that the hours on shall be consequtive (one continuous period) or spread around in multiple on-periods.

## Configuration

![Node Configuration](/lowest-price-config.png)

| Value                  | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| From Time              | The start time of the selected period.                                           |
| To Time                | The end time of the selected period.                                             |
| Hours On               | The number of hours that shall be turned on.                                     |
| Consecutive On-Period  | Check this if you need the on-period to be consecutive.                          |
| Send When Rescheduling | Check this to make sure on or off output is sent immediately after rescheduling. |
| If No Schedule, Send   | What to do if there is no valid schedule any more (turn on or off).              |
| Outside Period, Send   | Select the value to send outside the selected period.                            |

If you want to use a period of 24 hours, set the From Time and To Time to the same value. The time you select is signficant in the way that it decides which 24 hours that are considered when finding the hours with lowest price.

::: tip Example with Consecutive On-Period
One example to need a consecutive on-period can be if you want to control the washing machine. Let's say it needs 3 hours, and you want it to run between 22:00 and 06:00. Set `From Time = 22:00`, `To Time = 06:00` and check the `Consecutive On-Period` flag. This will turn on the cheapest 3-hour period from 22:00 to 06:00.

NB! It is not recommended to run the washing machine when you are sleeping or away.
:::

::: tip Example with non-consecutive on-period
If you have heating cables in the driveway, you may need them to be on only for a few hours every day, for example 4 hours, but it may not be important when this is. Then set `From Time = 00:00`, `To Time = 00:00` and **un-check** the `Consecutive On-Period` flag. This will turn on the 4 cheapest hours during the whole day, and off the rest.

You can use any time for start and end, but it is a good idea to use `00:00`, since the prices normally comes for this period.
:::

::: warning Outside Period, Send
Unless the period you select is 24 hours (`From Time` and `To Time` are the same), it is important what value you choose for `Outside Period, Send`. This decides whether the output is on or off during the period that is outside the selected period.
:::

::: danger Schedule not calculated
If you select a period for example from 10:00 to 02:00, it may not be possible to calculate before the period starts. This is because electricity prices for the next day (in the Nord Pool area) normally are received around 13:00. The node cannot calculate the period until it has price data for the whole period.
:::

### Dynamic config

It is possible to change config dynamically by sending a config message to the node. The config messages has a payload with a config object like this example:

```json
"payload": {
  "config": {
    "fromTime" : 10,
    "toTime" : 16,
    "hoursOn" : 3,
    "doNotSplit" : false,
    "sendCurrentValueWhenRescheduling" : true,
    "outputIfNoSchedule" : false,
    "outputOutsidePeriod": false
  }
}
```

All the variables in the config object are optional. You can send only those you want to change.

The config sent like this will be valid until a new config is sent the same way, or until the flow is restarted. On a restart, the original config set up in the node will be used.

When a config is sent like this, the schedule will be replanned based on the last previously received price data. If no price data has been received, no scheduling is done.

## Input

The input is the [common strategy input format](./strategy-input.md)

## Output

When a valid input is received, and the schedule is recalculated, the resulting schedule, as well as some other information, is sent to output 3. You can use this to see the plan and verify that it meets your expectations. You can also use it to display the schedule in any way you like.

Example of output:

```json
{
  "schedule": [
    {
      "time": "2021-12-10T00:00:00.000+01:00",
      "value": "true"
    },
    {
      "time": "2021-12-10T04:00:00.000+01:00",
      "value": true
    },
    {
      "time": "2021-12-10T10:00:00.000+01:00",
      "value": false
    },
    {
      "time": "2021-12-10T18:00:00.000+01:00",
      "value": "true"
    },
    {
      "time": "2021-12-11T04:00:00.000+01:00",
      "value": true
    },
    {
      "time": "2021-12-11T10:00:00.000+01:00",
      "value": false
    },
    {
      "time": "2021-12-11T18:00:00.000+01:00",
      "value": "true"
    }
  ],
  "hours": [
    {
      "price": 0.4778,
      "onOff": "true",
      "start": "2021-12-10T00:00:00.000+01:00",
      "saving": null
    },
    {
      "price": 0.4828,
      "onOff": "true",
      "start": "2021-12-10T01:00:00.000+01:00",
      "saving": null
    },
    //...
    {
      "price": 0.6514,
      "onOff": "true",
      "start": "2021-12-11T23:00:00.000+01:00",
      "saving": null
    }
  ],
  "source": "Tibber",
  "config": {
    "fromTime": "04",
    "toTime": "18",
    "hoursOn": "06",
    "doNotSplit": false,
    "sendCurrentValueWhenRescheduling": true,
    "outputIfNoSchedule": "true",
    "outputOutsidePeriod": "true"
  }
}
```

The `schedule` array shows every time the switch is turned on or off. The `hours` array shows values per hour containing the price (received as input), whether that hour is on or off, the start time of the hour and the amount per kWh that is saved on hours that are turned off, compared to the next hour that is on.

## Tips & tricks

### Multiple nodes works together

You can use multiple nodes simultanously, for different periods, if you want more hours on one part of the day than another part, or to make sure there are at least some hours on during each period.

### Highest price

If you want to find the `x` hours with the highest prices, do as follows:

1. Calculate `y` as the total number of hours in the period. For example, if the period is from `08:00` to `20:00`, then `y = 12`.
2. Configure `Hours On = y - x`, so if `x = 4`, then `Hours On = 12 - 4 = 8`.
3. Use **Output 2** to get a signal when you have the hours with the highest prices. Just remember that the value sent to output 2 is `false`, not `true` as it is on output 1.

# ps-strategy-best-save

![ps-strategy-best-save](../images/node-ps-strategy-best-save.png)

Strategy node to postpone power consumption until the price is lower.

## Description

This strategy turns off the hours where the price difference is largest compared to the next hour that is on. The idea is that the power you are not using when the switch is turned off, will be used immediately when the switch is turned on. This would fit well for turning off a water heater or another thermostat controlled heater.

The picture at the bottom of the page, under [Integration with MagicMirror](#integration-with-magicmirror), illustrates this by the purple strokes, taking the price from the top of the price curve to the level of the first hour after the save-period.

## Configuration

![Best Save Config](../images/best-save-config.png)

| Value                  | Description                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Max per sequence       | Maximum number of hours to turn off in a sequence.                                                                                                                   |
| Min recover            | Minimum hours to turn on immediately after a period when turned off the maximum number of hours that is allowed to be turned off                                     |
| Min saving             | Minimum amount to save per kWh in order to bother turning it off. It is recommended to have some amount here, e.g. 2 cents / 2 øre. No point in saving 0.001, is it? |
| Schedule for           | Select to schedule for the whole data set or only from the current hour.                                                                                             |
| Send when rescheduling | Check this to make sure on or off output is sent immediately after rescheduling                                                                                      |
| If no schedule, send   | What to do if there is no valid schedule any more (turn on or off).                                                                                                  |

::: warning Min recover
NB! The `Min recover` only has effect if the previous save-period is of length `Max per sequence`. If the save-period is shorter, the following on-period may be as short as one hour.
:::

::: tip Legionella
Many people ask if there is a danger that legionella bacteria will grow and become dangerous when the temperature of the water heater is lowered. As long as the water is heated to at least 65 °C every day, or at least every week, the risk of infection is not considered significant, according to the norwegian [FHI](https://www.fhi.no/nettpub/legionellaveilederen/).
:::

### Dynamic config

It is possible to change config dynamically by sending a config message to the node. The config messages has a payload with a config object like this example:

```json
"payload": {
  "config": {
    "maxHoursToSaveInSequence": 4,
    "minHoursOnAfterMaxSequenceSaved": 2,
    "minSaving": 0.02,
    "sendCurrentValueWhenRescheduling": true,
    "outputIfNoSchedule": true,
    "scheduleOnlyFromCurrentTime": false
  }
}
```

All the variables in the config object are optional. You can send only those you want to change.

The config sent like this will be valid until a new config is sent the same way, or until the flow is restarted. On a restart, the original config set up in the node will be used.

When a config is sent like this, the schedule will be replanned based on the last previously received price data. If no price data has been received, no scheduling is done.

## Input

The input is the [common strategy input format](./strategy-input.md)

## Output

There are three outputs. You use only those you need for your purpose.

### Output 1

A payload with the word `true` is sent to output 1 whenever the power / switch shall be turned on.

### Output 2

A payload with the word `false` is sent to output 2 whenever the power / switch shall be turned off.

### Output 3

When a valid input is received, and the schedule is recalculated, the resulting schedule, as well as some other information, is sent to output 3. You can use this to see the plan and verify that it meets your expectations. You can also use it to display the schedule in any way you like.

Example of output:

```json
{
  "schedule": [
    {
      "time": "2021-09-30T00:00:00.000+02:00",
      "value": false
    },
    {
      "time": "2021-09-30T01:00:00.000+02:00",
      "value": true
    }
  ],
  "hours": [
    {
      "price": 1.2584,
      "onOff": false,
      "start": "2021-09-30T00:00:00.000+02:00",
      "saving": 0.2034
    },
    {
      "price": 1.055,
      "onOff": true,
      "start": "2021-09-30T01:00:00.000+02:00",
      "saving": null
    },
    {
      "price": 1.2054,
      "onOff": true,
      "start": "2021-09-30T02:00:00.000+02:00",
      "saving": null
    }
  ],
  "source": "Nord Pool",
  "config": {
    "maxHoursToSaveInSequence": 3,
    "minHoursOnAfterMaxSequenceSaved": "1",
    "minSaving": 0.001,
    "sendCurrentValueWhenRescheduling": true,
    "outputIfNoSchedule": false
  }
}
```

The `schedule` array shows every time the switch is turned on or off. The `hours` array shows values per hour containing the price (received as input), whether that hour is on or off, the start time of the hour and the amount per kWh that is saved on hours that are turned off, compared to the next hour that is on.

## Algorithm

The calculation that decides what hours to turn off works as follows:

1. A matrix (x \* y) is created where x is the number of hours we have price information for, and y is the configured maximum number of hours to turn off in a sequence.
2. The matrix is filled with how much you save by turning off hour x for y hours.
3. The matrix is processed calculating all possibilities for turning off a number of hours in a sequence and by that saving money. In this process all non-saving sequences are discarded. Also, if the average saving per hour is less than what you have configured as minimum amount to save per kWh, the sequence is discarded.
4. The remaining sequences are sorted by how much that is saved, in descending order.
5. Next, a table with one value per hour is created, with all hours in state "on".
6. Then the saving sequences is applied one by one, turning off the hours in each sequence, discarding sequences that lead to any violation of the rules set by the config.
7. When all sequences are processed, the resulting table shows a pretty good savings plan, that in most cases would be the optimal plan.

I say "in most cases", because there is a chance that a group of two or more sequences combined can give a better plan than a single sequence preceeding those two, but where the selection of the one sequence causes the group to be discarded. If anyone encounters this situation, I would be happy to receive the price data set, and try to improve the algorithm even further.

## Integration with MagicMirror

Are you using [MagicMirror](https://magicmirror.builders/)? Are you also using [Tibber](https://tibber.com/)? If so, there is a module for MM called [MMM-Tibber](https://github.com/ottopaulsen/MMM-Tibber), that easily can be used to show savings from this node.

![Show savings in MMM-Tibber](https://github.com/ottopaulsen/MMM-Tibber/blob/master/doc/MMM-Tibber-screenshot-savings-graph.png?raw=true)

The purple lines show savings per kWh.

Read more about this in the [MMM-Tibber documentation](https://github.com/ottopaulsen/MMM-Tibber#show-savings).

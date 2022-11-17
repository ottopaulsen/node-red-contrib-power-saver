# node-red-contrib-power-saver v2 (deprecated)

A Node-RED node to save money when power prices are changing. Saving is done by postponing power consumption until the price is lower.

You can configure maximum number of hours to save in a sequence, and minimum time to recover after a maximum saving period.

![Normal flow](https://github.com/ottopaulsen/node-red-contrib-power-saver/blob/main/doc/node-red-contrib-power-saver-flow.png?raw=true)

You can use it to control for example a heater, a water heater or any other power consumer that is acceptable to turn off now and then.

The node takes power prices per hour as input, and sends output to turn a switch on or off based on the power price. It also outputs the schedule that is planned, as well as how much you save per kWh for each of the hours that are turned off, assuming that the same power is used as soon as the power is turned on.

Power prices may be received from Tibber, Nord Pool or any other source that gives price per hour for today and optionally tomorrow. It is primarily made to be used together with Home Assistant (HA), but there is no dependency to HA, so it can just as well be used by itself.

The node can also be used in combination with MagicMirror with the MMM-MQTT and MMM-Tibber modules, in order to get the savings displayed on the MM screen in the MMM-Tibber module.

**NB! WIP**

This node is currently rather new, and has been tried for a few weeks, enough to come in a version two with improved savings plan.

Feel free to try it, and report back problems or ideas as [Github issues](https://github.com/ottopaulsen/node-red-contrib-power-saver/issues).

## Installation

Install in Node-RED via the Manage Palette menu.

May also be installed via npm:

`npm install node-red-contrib-power-saver`

Make sure that you upgrade now and then to get the latest version. See [changelog](CHANGELOG) for changes.

## Input

3 different types of input are accepted:

- Tibber
- Nordpool
- Other sources in a specific JSON format

Choose the one that fits you best. Of course, all inputs are JSON, but the Tibber and Nord Pool alternatives are designed to connect directly to those sources with a minimum effort.

From version 2.1.0, you can also send a config object as input for dynamically changing the node config.

### Tibber input

If you are a Tibber customer, you can use the `tibber-query` node from the [`node-red-contrib-tibber-api` node](https://flows.nodered.org/node/node-red-contrib-tibber-api). Set it up with the following query:

```gql
{
  viewer {
    homes {
      currentSubscription {
        priceInfo {
          today {
            total
            startsAt
          }
          tomorrow {
            total
            startsAt
          }
        }
      }
    }
  }
}
```

Send the result from the `tibber-query` node with the query above directly to the `power-saver` node. Make sure it is refreshed when new prices are ready. Prices for the next day are normally ready at 13:00, but refreshing every hour can be a good idea.

[See example with Tibber, a switch and MQTT](doc/example-tibber-mqtt.md)

### Nordpool input

This is especially designed to work for Home Assistant (HA), and the [Nord Pool custom component](https://github.com/custom-components/nordpool). The Nord Pool component provides a _sensor_ that gives price per hour for today and tomorrow (after 13:00). Send the output from this sensor directly to the `power-saver` node. Make sure this is done whenever the node is updated, as well as when the system starts up.

Data can be sent from both the `current state` node or the `events: state` node.

[See example with Nord Pool and `current state` node](doc/example-nordpool-current-state.md)

[See example with Nord Pool and `events: state` node](doc/example-nordpool-events-state.md)

### Other input

If you cannot use any of the two above (Tibber or Nord Pool), create the input to the node with the payload containing JSON like this:

```json
{
  "today": [
    { "value": 1, "start": "2021-06-21T00:00:00+02:00" },
    { "value": 2, "start": "2021-06-21T01:00:00+02:00" }
    //...
  ],
  "tomorrow": [
    { "value": 3, "start": "2021-06-22T00:00:00+02:00" },
    { "value": 4, "start": "2021-06-22T01:00:00+02:00" }
    //...
  ]
}
```

## Output

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
    //...
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
    //...
  ],
  "source": "Nordpool",
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

## Configuration

Currently there is only one strategy for saving. This is the _mostSaved_ strategy. This strategy turns off the hours where the price difference is largest compared to the next hour that is on. The idea is that the power you are not using when the switch is turned off, will be used immediately when the switch is turned on. This would fit well for turning of a water heater or another thermostat controlled heater.

You can configure the following:

- Maximum number of hours to turn off in a sequence.
- Minimum hours to turn on immediately after a period when turned off the maximum number of hours that is allowed to be turned off.
- Minimum amount to save per kWh in order to bother turning it off. It is recommended to have some amount here, e.g. 2 cents / 2 øre. No point in saving 0.001, is it?
- Wether to send on/off just after a reschedule is done without waiting until the next scheduled switch.
- What to do if there is no valid schedule any more (turn on or off).

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

## Change Log

See [CHANGELOG.md](CHANGELOG.md)

## Contribute

Contributions are welcome. Please start by creating a Github Issue with suggested changes, and state what you would like to do.

###

<AdsenseAdd type="nederst"/>

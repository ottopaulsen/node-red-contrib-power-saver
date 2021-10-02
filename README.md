# node-red-contrib-power-saver

A Node-RED node to save money by turning off power when the power price is highest.

![Normal flow](https://github.com/ottopaulsen/node-red-contrib-power-saver/blob/main/doc/node-red-contrib-power-saver-flow.png?raw=true)

You can use it to control for example a heater, a water heater or any other power consumer that is acceptable to turn off now and then.

The node takes power prices per hour as input, and sends output to turn a switch on or off based on the power price. It also outputs the schedule that is planned, as well as how much you save per kWh for each of the hours that are turned off, assuming that the same power is used as soon as the power is tuened on.

Power prices may be received from Tibber, Nordpool or any other source that gives price per hour for today and optionally tomorrow. It is primarily made to be used together with Home Assistant (HA), but there is no dependency to HA, so it can just as well be used by itself.

The node can also be used in combination with MagicMirror with the MMM-MQTT and MMM-Tibber modules, in order to get the savings displayed on the MM screen in the MMM-Tibber module:

NB! WIP

This node is currently very new, and has hardly been tried. Feel free to try it, and report back problems or ideas as Github issues.

## Input

3 different types of input are accepted:

* Tibber
* Nordpool
* Other sources in a specific JSON format

Choose the one that fits you best. Of course, all inputs are JSON, but the Tibber and Nordpool alternatives are designed to connect directly to those sources with a minimum effort.

### Tibber input

If you are a Tibber customer, you can use the `tibber-query` node from the [`node-red-contrib-tibber-api` node](https://flows.nodered.org/node/node-red-contrib-tibber-api). Set it up with the following query:

```gql
{
  viewer {
    homes {
      currentSubscription{
        priceInfo{
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

### Nordpool input

This is especially designed to work for Home Assistant (HA), and the [Nordpool custom component](https://github.com/custom-components/nordpool). The Nordpool component provides a *sensor* that gives price per hour for today and tomorrow (after 13:00). Send the output from this sensor directly to the `power-saver` node. Make sure this is done whenever the node is updated, as well as when the system starts up.

NB! I myself have trouble with my Nordpool sensor in HA. It is not updating properly. Please give feedback how you experience this, preferably as Github issues.

### Other input

If you cannot use any of the two above (Tibber or Nordpool), create the input to the node with the payload containing JSON like this:

```json
{
  "today": [
    { "value": 1, "start": "2021-06-21T00:00:00+02:00" },
    { "value": 2, "start": "2021-06-21T01:00:00+02:00" },
    ...
  ],
  "tomorrow": [
    { "value": 3, "start": "2021-06-22T00:00:00+02:00" },
    { "value": 4, "start": "2021-06-22T01:00:00+02:00" },
    ...
  ],
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
    },
    ...
  ],
  "hours": [
    {
      "price": 1.2584,
      "onOff": false,
      "start": "2021-09-30T00:00:00.000+02:00",
      "saving": 0.2034
    },
    {
      "price": 1.0550,
      "onOff": true,
      "start": "2021-09-30T01:00:00.000+02:00",
      "saving": null
    },
    {
      "price": 1.2054,
      "onOff": true,
      "start": "2021-09-30T02:00:00.000+02:00",
      "saving": null
    },
    ...
  ]
}
```

The `schedule` array shows every time the switch is turned on or off. The `hours` array shows values per hour containing the price (received as input), whether that hour is on or off, the start time of the hour and the amount per kWh that is saved on hours that are turned off, compared to the next hour that is on.

## Configuration

Currently there is only one strategy for saving. This is the *mostSaved* strategy. This strategy turns off the hours where the price difference is largest compared to the next hour that is on. The idea is that the power you are not using when the switch is turned off, will be used immediately when the switch is turned on. This would fit well for turning of a water heater or another thermostat controlled heater.

You can configure the following:

* Maximum number of hours to turn off during a day (24 hours).
* Maximum number of hours to turn off in a sequence.
* Minimum hours to turn on immediately after a period when turned off the maximum number of hours that is allowed to be turned off.
* Minimum amount to save per kWh in order to bother turning it off.
* What to do if there is no valid schedule any more (turn on or off).

## Integration with MagicMirror

Are you using [MagicMirror](https://magicmirror.builders/)? Are you also using [Tibber](https://tibber.com/)? If so, there is a module for MM called [MMM-Tibber](https://github.com/ottopaulsen/MMM-Tibber), that easily can be used to show savings from this node. 


![Show savings in MMM-Tibber](https://github.com/ottopaulsen/MMM-Tibber/blob/master/doc/MMM-Tibber-screenshot-savings-graph.png?raw=true)

The purple lines show savings.

Read more about this in the [MMM-Tibber documentation](https://github.com/ottopaulsen/MMM-Tibber#show-savings).

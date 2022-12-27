# Dynamic config

It is possible to change config dynamically by sending a config message to the node.
This applies to the following nodes:

- Best Save
- Lowest Price
- Heat Capacitor
- Schedule Merger

Dynamic config is sent on the input as a message with a payload containing a `config` object and optionally a `name`.
Example:

```json
"payload": {
  "name": "Best Save",
  "config": {
    "maxHoursToSaveInSequence": 4,
    "minSaving": 0.02
  }
}
```

See documentation for each specific node for which values that can be sent.
All the variables in the config object are optional. You should send only those you want to change.

::: tip name
If `name` is used, it must match the nodes name in order to have effect. Normally you do not use `name`.
The main intention of `name` is for the [grid capacity example](../examples/example-grid-tariff-capacity-part.md)
to be able to override a specific strategy node.
The `name` is the exact same value as you set as name in the nodes config.
:::

###

<AdsenseAdd type="artikkel"/>

## Output values

Valid values for `outputValueForOntype` and `outputValueForOfftype` are `bool`, `num` and `str` and must correspond
with the values for `outputValueForOn` and `outputValueForOff`. Also `str` values must be enclosed by quotes, for example:
`"outputValueForOn": "myvalue"`, while `num` and `bool` values shall not, for example: `"outputValueForOn": 1`.

The config sent like this will be valid until a new config is sent the same way, or until the flow is restarted. On a restart, the original config set up in the node will be used.

When a config is sent like this, and without price data, the schedule will be replanned based on the last previously received price data. If no price data has been received, no scheduling is done.

However, you can send config and price data in the same message. Then both will be used.

## Override

It is possible to send an override message to a strategy node (Best Save or Lowest Price) and to the Schedule Merger node.
An override message looks like this:

```json
"payload": {
  "name": "Best Save",
  "config": {
    "override": "off"
  }
}
```

`name` is optional and is only necessary when you send the message to multiple nodes, but want it to have effect only on
nodes with the given name.

Legal values for override are:

| Value    | Function                                                                                 |
| -------- | ---------------------------------------------------------------------------------------- |
| `"on"`   | The node will only send output `on`                                                      |
| `"off"`  | The node will only send output `off`                                                     |
| `"auto"` | The node will work according to the schedule. This is the standard and the default mode. |

## Config saved in context

The nodes config is saved in the nodes context.
If dynamic config is sent as input, this replaces the saved config.
It is the config that is saved in context that is used when calculating.
When Node-RED starts or the flow is redeployed, the config defined in the node replaces the saved config and will be used when planning.

###

<AdsenseAdd type="nederst"/>

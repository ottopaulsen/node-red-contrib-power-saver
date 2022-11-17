###

<AdsenseAdd type="øverst"/>

# Dynamic commands

You can dynamically send some commands to the node via its input, by using a `commands` object in the payload as described below.
This applies to the following nodes:

- Best Save
- Lowest Price
- Schedule Merger

Commands can be sent together with config or price data. You can command multiple commands in one message, but then put them all in the same commands-object.

## Commands

### sendSchedule

You can get the schedule sent to output 3 any time by sending a message like this to the node:

```json
"payload": {
  "commands": {
    "sendSchedule": true,
  }
}
```

When you do this, the current schedule is actually recalculated based on the last received data, and then sent to output 3 the same way as when it was originally planned.

### sendOutput

You can get the node to send the current output to output 1 or 2 any time by sending a message like this to the node:

```json
"payload": {
  "commands": {
    "sendOutput": true,
  }
}
```

When you do this, the current schedule is actually recalculated based on the last received data. The current output is sent to output 1 or 2.

###

<AdsenseAdd type="artikkel"/>

### reset

You can reset data the node has saved in context by sending this message:

```json
"payload": {
  "commands": {
    "reset": true,
  }
}
```

When you do this, all historical data the node has saved is deleted, including the current schedule, so the result will be
that the node shows status "No price data". When new price data is received, a schedule is calculated without considering any history.

The nodes config is not deleted, as the node depends on it to work.

::: warning
This operation cannot be undone.

However, it is normally not a big loss, as you can just feed the node with new price data and start from scratch.
:::

### replan

By sending this command, you can have the node read the last received prices from the context storage,
and make a plan based on those prices:

```json
"payload": {
  "commands": {
    "replan": true,
  }
}
```

If the context storage is `file` you can use this to create a new schedule after a restart,
instead of fetching prices again.

###

<AdsenseAdd type="nederst"/>

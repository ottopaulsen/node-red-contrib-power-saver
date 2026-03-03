---
prev: ./ps-schedule-merger.md
next: ./ps-general-add-tariff.md
---

# ps-price-filter

## Description

The Price Filter node forces the schedule on or off for any minutes where the price meets a configured condition (over or under a limit). Connect the **schedule output** (output 3) of a strategy node — [Lowest Price](./ps-strategy-lowest-price.md), [Best Save](./ps-strategy-best-save.md) or [Schedule Merger](./ps-schedule-merger.md) — to this node's input. The filter will apply the configured rule to each minute's price and produce a new schedule on all three outputs, just like any other strategy node.

This is useful when you want to force a device **off** if electricity is too expensive, or force it **on** during very cheap periods — regardless of what the upstream strategy decided.

## Configuration

| Value       | Description                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name        | Optional name for this node.                                                                                                                                             |
| Turn        | Whether to force the switch **On** or **Off** when the price condition is met.                                                                                           |
| If price is | The direction of the comparison: **Over** or **Under** the configured limit.                                                                                             |
| Limit       | The price threshold. Minutes with a price above (Over) or below (Under) this value trigger the filter. The price unit matches the price data received. |

The output values (value for on, value for off, behaviour if no schedule, etc.) are inherited from the upstream strategy node and are not configured here.

## Inputs

The input must be **output 3** (the schedule output) from one of the following strategy nodes:

- ps-strategy-lowest-price
- ps-strategy-best-save
- ps-schedule-merger

## Output

There are three outputs. You use only those you need for your purpose.

### Output 1

A payload with the value set in config, default `true`, is sent to output 1 whenever the power / switch shall be turned on.

### Output 2

A payload with the value set in config, default `false` is sent to output 2 whenever the power / switch shall be turned off.

### Output 3

When a valid input is received, and the schedule is recalculated, the resulting schedule, as well as some other information, is sent to output 3. You can use this to see the plan and verify that it meets your expectations. You can also use it to display the schedule in any way you like.

## How it works

1. Each minute in the incoming schedule is examined.
2. If the minute has a price strictly **over** (or **under**) the configured limit, its `onOff` value is forced to the value configured in **Turn**.
3. A new schedule is built from the modified minutes array.
4. Outputs are sent exactly like any other strategy node (output 1/2 for the current on/off state, output 3 for the schedule).

Minutes with a `null` price are left unchanged.

## Usage ideas

### Cut off heating cables if very expensive

If you are controlling for example heating cables with the Lowest Price node,
you can use this to make sure you never turn on the heating cable if the price is extremely high.

<VippsPlakat/>

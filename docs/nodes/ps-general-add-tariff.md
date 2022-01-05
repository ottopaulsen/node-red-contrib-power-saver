# ps-general-add-tariff

![ps-general-add-tariff](../images/node-ps-general-add-tariff.png)

Node to add a value, for example a variable grid tariff, to the price before it is used to calculate savings in the strategy nodes.

## Description

This node is useful if there is an addition to the electricity price that varies over the day, as it might be for the grid tariff.

If there is one price for example from 22:00 to 06:00 every day, and another price from 06:00 to 22:00, this is the right node to use. It can be used for more than two periods, as long as the time it changes is the same every day.

Here is how this node is normally used:

![general flow](../images/add-tariff-flow.png)

::: tip Changes during the year
If there is one price now, and another price from a specific date, you can use two nodes after each other. Set the `Valid to date` of the node with the current prices to the last date the current prices are valid. Set the `Valid from date` of the node with the upcoming prices to the first date those prices are valid.
:::

## Configuration

### Add and delete periods

You can have from 1 to 24 periods during the day, with different values to add for each hour. Click the `Add period` button to add more periods. Click the `X` button to delete a period.

### From time and Value

For each period, select the time of the day the value is valid from, and enter the value.

### Valid from date

Fill in the first date the config is valid.

If this is empty, the config is valid from the dawn of time.

### Valid to date

Fill in the last date the config is valid.

If this is empty, the config is valid until forever.

## Input

The input is the [common strategy input format](./strategy-input.md)

## Output

The output is the [common strategy input format](./strategy-input.md)

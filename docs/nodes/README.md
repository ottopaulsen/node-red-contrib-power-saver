# Nodes

Here is an overview of the nodes, and links to detailed descriptions for eah of them.

## Strategy nodes

These are the nodes used to calculate and control saving.

### [Power Saver (deprecated)](./power-saver)

![Power Saver node](/node-power-saver.png)

The old node from version 2 is still working, but should be replaced.

### [ps-strategy-best-save](./ps-strategy-best-save)

![ps-strategy-best-save](/node-ps-strategy-best-save.png)

Strategy to find the best hours to turn off for most saving.

### [ps-strategy-lowest-price](./ps-strategy-lowest-price)

![ps-strategy-lowest-price](/node-ps-strategy-lowest-price.png)

Strategy to find the x hours with lowest price in a given period each day.

## Utility nodes

### [ps-receive-price](./ps-receive-price)

![ps-receive-price](/node-ps-receive-price.png)

Node to convert different types of input data to the format used by the strategy nodes.

## Grid tariff nodes

### [ps-elvia-add-tariff](./ps-elvia-add-tariff)

![ps-elvia-add-tariff](/node-ps-elvia-add-tariff.png)

Node to add Elvia grid tariff to the prices before sending them to the strategy nodes.

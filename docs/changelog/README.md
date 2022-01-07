---
sidebar: "auto"
---

# Change Log

List the most significant changes, starting in version 1.0.9.

## 3.2.1

- Fix that may solve the problem with multiple outputs at the same time.

## 3.2.0

- Config can be sent on input to strategy nodes together with price data, in the same message.
- The ps-receive-price and ps-xxx-add-tariff nodes pass config through from input to output.
- Status on strategy nodes shows the time for the next change.

## 3.1.2

- Add time, version and current value to output from strategy nodes.

## 3.1.1

- Fix schedule for Lowest Price node so it uses data from previous day correctly. It sometimes failed when the selected period went over midnight.
- Fix so old data in the Lowest Price node context is deleted.

## 3.1.0

- New node `ps-general-add-tariff` to add values that varies af fixed times during the day.

## 3.0.10

- Fix bug in ps-elvia-add-tariff so it connects to API.

## 3.0.9

- Fix Nord Pool input for current state node, to read data when payload is set to entity.

## 3.0.8

- Fix bug in Lowest Price node when period goes over midnight.
- Fix documentation - lots of pages were failing.

## 3.0.7

- Fix Nord Pool current state node input.

## 3.0.6

- Remove non-existent node from package.json.

## 3.0.5

- Move dependencies to correct section (node_fetch and lodash.cloneDeep).

## 3.0.4

- Remove `null`-values from Nord Pool data for `tomorrow`.

## 3.0.3

- Fix bug in lowest price strategy, when period ends at midnight.
- Fix labels for hours on, so they do not have leading zero.
- Fix so source should be visible in output 3.

## 3.0.2

- Bugfix in Lowest Price node (not successful)

## 3.0.1

- Fix so elvia subscription key is stored as credential
- Fix bug on config for strategy nodes. Config was not saved properly.
- Remove double output bug, and better handling when hoursOn > period

## 3.0.0

- Deprecating old Power Saver node, adding multiple new nodes.
- New node `ps-strategy-best-save` is replacing old node `Power Saver` together with the new `ps-receive-price` node.
- Add new strategy node: `ps-strategy-lowest-price`.
- Add new node: `ps-receive-price`.
- Add grid tariff for Elvia customers, using the `ps-elvia-add-tariff` node.
- New documentation.
- Change node category to Power Saver.

## 2.1.0

- Accept config as input, making it possible to dynamically change config
- Fix dropdown for config value for selecting output when there is no schedule
- Improve config screen and documentation

## 2.0.5

- Update links to examples

## 2.0.4

- Update doc and add examples

## 2.0.3

- Bugfix

## 2.0.2

- Fix so Nord Pool data can be read directly from the current state node

## 2.0.1

- Fix bug that caused no schedule
- Add config to output

## 2.0.0

- New and better algorithm to calculate savings, resulting in a better schedule.
- Removed possibility to configure maximum hours to save per day, as this does not really make much sense.
- Round savings to 4 decimals.
- Set last savings hour to null when 0.

## 1.0.9

- Fix bug in saving last hour of the day.

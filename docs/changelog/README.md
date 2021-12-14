---
sidebar: "auto"
---

# Change Log

List the most significant changes, starting in version 1.0.9.

## 3.0.3

- Fix bug in lowest price strategy, when period ends at midnight.
- Fix labels for hours on, so they do not have leading zero.
- Fix so source should be visible in output 3.

## 3.0.2

- Bugfix in Lowest Price node (not successful)

## 3.0.1

- Fix so elvia subscripion key is stored as credential
- Fix bug on config for strategy nodes. Config was not saved properly.
- Remove double output bug, and better handling when hoursOn > period

## 3.0.0

- Deprecating old Power Saver node, adding multiple new nodes.
- New node `ps-strategy-best-save` is replacing old node `Power Saver` together with the new `ps-receive-price` node.
- Add new strategy node: `ps-strategy-lowest-price`.
- Add new node: `ps-receive-price`.
- Add gridd tariff for Elvia customers, using the `ps-elvia-add-tariff` node.
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

- Fix so Nordpool data can be read directly from the current state node

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

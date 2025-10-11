---
sidebar: "auto"
sidebarDepth: 1
---

# Change Log

List the most significant changes.

## 5.0.0 beta.1

 - Fix bug `dataDayBefore.minutes is not iterable`
 - Update example for Lovelace Visualization. That example also has a function node that reduces the number of entries in the minutes array, that can be useful other places too.

Please note that if you have nodes using the hours array on output 3, you need to change those to use the minutes array.

## 5.0.0 beta.0

::: danger BREAKING CHANGE
This is a breaking change.
The Best Save and Lowest Price nodes will require reconfiguration to work properly.
See the documentation for details.

**Bugs to be expected**
This is a very early release with support for 15 minutes intervals.
You should expect to find bugs. Please report using github issues. Please also report bugs in the documentation.
Not all features are adapted to the 15 minutes price intervals and to the changes done in this version.
:::

 - Supports 15 minutes price intervals.
 - Can schedule periods down to minute resolution.

## 4.2.5

 - Changes to Capacity part of grid tariff example, Update sensors node: Adding filter so onoy sensors that has a value are set, to avoid error message.
 - Changes to Capacity part of grid tariff example, Reduction Actions node: Use `action` in stead of the deprecated `domain` and `service` to perform actions.
 - Fix favicon in doc.
 - Remove v2 doc.


## 4.2.4

 - Update dependencies

## 4.2.3

 -  Update dependencies

## 4.2.2

 - Remove ads from doc.
 - Remove console.log msg from node.

## 4.2.1

 - Bugfix version 4.2.0. Change was not effective.

## 4.2.0

 - Format time on node status with HH:MM format. No AM/PM any more.
 - Remove warning for `No schedule` in debug output.

 

## 4.1.5

 - Fixed bug based on [this issue](https://github.com/ottopaulsen/node-red-contrib-power-saver/issues/184). Now correctly uses the value for `outputOutsidePeriod` when the planning period spans midnight, and there is no data available before midnight. In this case, the period from midnight to end time cannot be planned, so `outputIfNoSchedule` will be used until end time, and `outputOutsidePeriod` will be used from then. See the issue for more details.

## 4.1.4

- Update dependencies.



## 4.1.3

- Fix bug that saved some data in wrong context storage.

## 4.1.2

- Fix so configured values for output are sent, not only true/false.
- Catch error from Elvia API so NR does not crash.

## 4.1.1

- Update dependencies



## 4.1.0

- Fix bug with override function. It did not override longer than until next scheduled change. Now it overrides until set to auto again.
- Show override on node status.
- Fix name filter on schedule merger node.

## 4.0.0

This is a major rewrite of some of the central code, in order to lay ground for further development and maintenance.
There are a couple of new nodes that open for many interesting use cases.
A rewrite like this may lead to changes in behavior, intended or not.
There are some breaking changes, but most users should not be affected by them.



### New features

- New node `ps-schedule-merger` or `Schedule Merger`, used to merge schedules from multiple Best Save and/or Lowest Price nodes,
  as well as the new Fixed Schedule node.
- New strategy node `ps-strategy-fixed-schedule` or `Fixed Schedule`, to set a fixed daily or weekly schedule.
  The main purpose of this node is to function as a mask for other strategies when merged using the Schedule Merger,
  but it can also be used alone.
- For Best Save and Lowest Price you now can configure the output value, sent on output 1 and 2 to turn on or off.
  Default is true/false as before, but you can configure to send for example 1 and 0, or "on" and "off", or any
  other number or string values.
- The config output on Best Save and Lowest Price (as well as the new Schedule Merger) has a new attribute: `hasChanged`.
  It is set to `true` if the config just was changed by a config input message.
- You can now donate using Vipps :-)

### Breaking changes

- The old Power Saver node has been removed, as it has been deprecated for a long time.
- The `sentOnCommand` output has been removed.
- Some bug-fixes may be regarded as breaking.
- There may be some changes to what data that is stored in the context.



### Bug fixes

- Fix so the `If no schedule, send` config works as one should expect for the end of the schedule.
  If the last scheduled switch is different from this setting, a switch to the
  value set by this setting will be scheduled on the first hour after the whole schedule, normally at midnight.
  The `countHours` value for this schedule will be `null`, as it is impossible to say how many hours it will last for.
- Fixed also so `If no schedule, send` works if the schedule only exists for the future. Then this value is used until the
  time for the first scheduled value is reached.
- Fixed Best Save and Lowest Price so when rescheduling, for example if prices are received,
  and `Send when rescheduling` is not checked,
  output to output 1 or output 2 is only sent if it has not been sent before,
  or if it is changed by the new schedule. This is to avoid sending output when not
  necessary, that is if there is no change. Of course, if the `Send when rescheduling` is checked,
  output is sent anyway.

  NB! If for some reason a switch did not catch the last output, this may lead to it not being switched
  until the next scheduled switch. If you get trouble with that, you can always enforce switch output
  by sending the [`sendOutput` command](../nodes/dynamic-commands.html#sendoutput).

- Fix price receiver so it works when price is 0.
- Fixed bug in Lowest Price and Best Save for 0 prices.
- Improved error handling for Elvia Add Tariff.

<VippsPlakat/>

## 3.6.2

- Fix bug in Elvia API causing Node-RED to crash when the API key was wrong. Not it shows status `Unauthorized` and survive.

## 3.6.1

- Fix bug in Best Save node, so a better saving is not overwritten by a not as good saving in an overlapping period. This bug could occur in rare cases when a shorter savings period gave better results than a longer.

## 3.6.0

- New feature `Max price` for Lowest Price node. Can be set to only turn on if prices is below or equal to the max price.
- New value in output 3 from the Lowest Price and Best Save nodes, `countHours`, telling the number of hours that the value will stay.

## 3.5.7

- Add day-filter to general-add-tariff node so it can add one tariff for some days, and another tariff for other days.
- Fix the elvia-add-tariff node so time is correct. The Elvia API does not handle time zone on the request, so this must be corrected for.
- Fix link to node-documentation in node edit dialogs.

## 3.5.6

- Update Elvia nodes so they use the new `digin` API. NB! There is no guarantee this is working right.

## 3.5.5

- Fix config storage for Best Save node

## 3.5.4

- Fix bug in context selection
- Add example for visualization in Lovelace

## 3.5.3

- Fix a couple of bugs in how context is used.

## 3.5.2

- Re-introduce the search bar, after Vuepress upgrade.

## 3.5.1

- Update github actions to deploy automatically to the npm library.



## 3.5.0

- Select what context storage to store data in the node configuration.
- New dynamic command: `replan`, that can be sent after a restart in order to create a schedule based on the last received prices, provided `file` is used as context storage (alternatively another permanent storage).
- Some improvements to node status.

## 3.4.4

- Fix bug in Best Save Viewer in the documentation (under FAQ)

## 3.4.3

- Fix Elvia config so it can be used independently on any node.

## 3.4.2

- Fix bug in reset command. It did not reset daily data properly.

## 3.4.1

- Update examples
- Update dependencies
- Move doc to powersaver.no

## 3.4.0

- Added new strategy node Heat Capacitor

## 3.3.2

- Add command sendOutput.

## 3.3.1

- Move doc to [power-saver.smoky.no](power-saver.smoky.no)
- Make tool to test the result of the best save node: [Best Save Viewer](power-saver.smoky.no/faq/best-save-viewer.html)

## 3.3.0

- Remove the config option to schedule from the current hour. The feature did not work, and it was not clear how it should work.
- Added a dynamic command feature to make it possible to dynamically
  1. Tell the node to send the schedule to output 3.
  2. Reset saved data making the next schedule to start without historical data.
- Fix node status so it says "No price data" when there is no price data available.
- Added an FAQ section to the doc.



## 3.2.3

- Remove unused imports
- Fix doc deployment issue

## 3.2.2

- New attempt to solve the problem with multiple outputs at the same time.

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


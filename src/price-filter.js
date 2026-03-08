"use strict";

const cloneDeep = require("lodash.clonedeep");
const { DateTime } = require("luxon");
const { booleanConfig, getOutputForTime, makeScheduleFromMinutes } = require("./utils");
const { handleOutput } = require("./handle-output");
const { addLastSwitchIfNoSchedule, getCommands } = require("./handle-input");
const { mergerShallSendOutput, mergerShallSendSchedule, msgHasSchedule } = require("./schedule-merger-functions");

module.exports = function (RED) {
  function PriceFilterNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.status({});

    node.turn = config.turn || "off";
    node.condition = config.condition || "over";
    node.limit = parseFloat(config.limit) || 0;
    node.contextStorage = config.contextStorage || "default";

    node.on("close", function () {
      clearTimeout(node.schedulingTimeout);
    });

    node.on("input", function (msg) {
      if (!msgHasSchedule(msg)) {
        return;
      }

      const incomingConfig = msg.payload.config || {};

      // Inherit output-related settings from the upstream node's config so the scheduler
      // and switch outputs behave consistently with the preceding strategy node.
      node.outputValueForOn = incomingConfig.outputValueForOn !== undefined ? incomingConfig.outputValueForOn : true;
      node.outputValueForOff =
        incomingConfig.outputValueForOff !== undefined ? incomingConfig.outputValueForOff : false;
      node.outputIfNoSchedule =
        incomingConfig.outputIfNoSchedule !== undefined ? booleanConfig(incomingConfig.outputIfNoSchedule) : true;
      node.override = incomingConfig.override || "auto";
      node.sendCurrentValueWhenRescheduling =
        incomingConfig.sendCurrentValueWhenRescheduling !== undefined
          ? booleanConfig(incomingConfig.sendCurrentValueWhenRescheduling)
          : true;

      // Deep-clone minutes so we do not mutate the incoming message.
      const minutes = cloneDeep(msg.payload.minutes);
      const forcedValue = node.turn === "on";

      minutes.forEach((m) => {
        if (m.price == null) return;
        const triggered =
          (node.condition === "over" && m.price > node.limit) || (node.condition === "under" && m.price < node.limit);
        if (triggered) {
          m.onOff = forcedValue;
        }
      });

      const schedule = makeScheduleFromMinutes(minutes);
      addLastSwitchIfNoSchedule(schedule, minutes, node);

      const plan = {
        minutes,
        schedule,
        source: node.name,
      };

      // Merge the upstream config with this node's filter config for output 3.
      const outputConfig = {
        ...incomingConfig,
        turn: node.turn,
        condition: node.condition,
        limit: node.limit,
      };

      const planFromTime = msg.payload.time ? DateTime.fromISO(msg.payload.time) : DateTime.now();
      const commands = getCommands(msg);
      const currentOutput = node.context().get("currentOutput", node.contextStorage);
      const plannedOutputNow =
        node.override === "auto"
          ? getOutputForTime(plan.schedule, planFromTime, node.outputIfNoSchedule)
          : node.override === "on";

      const outputCommands = {
        sendOutput: mergerShallSendOutput(
          msg,
          commands,
          currentOutput,
          plannedOutputNow,
          node.sendCurrentValueWhenRescheduling,
        ),
        sendSchedule: mergerShallSendSchedule(msg, commands),
        runSchedule: commands.runSchedule || (commands.runSchedule !== false && msgHasSchedule(msg)),
      };

      handleOutput(node, outputConfig, plan, outputCommands, planFromTime);
    });
  }

  RED.nodes.registerType("ps-price-filter", PriceFilterNode);
};

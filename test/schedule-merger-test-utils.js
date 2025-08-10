function makeFlow(logicFunction, outputIfNoSchedule = true) {
  return [
    {
      id: "n1",
      type: "ps-schedule-merger",
      name: "test name",
      logicFunction,
      outputIfNoSchedule,
      schedulingDelay: 10, // May need to increase on a slow computer
      sendCurrentValueWhenRescheduling: true,
      wires: [["n3"], ["n4"], ["n2"]],
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" },
    { id: "n4", type: "helper" },
  ];
}

function makePayload(strategyNodeId, minutes) {
  const payload = {
    strategyNodeId,
    minutes,
  };
  return payload;
}

module.exports = { makeFlow, makePayload };

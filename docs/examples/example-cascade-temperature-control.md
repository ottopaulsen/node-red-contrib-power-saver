# Cascade temperature control

## Description
The controller changes the setpoint of climate entities to regulate the temperature of room.

An example:
A room has a temperature sensor and en electric heater. Given a setpoint temperature, the controller can make the sensor match the given value by adjusting the temperature settings of the electric heater. This type of control usually reacts faster and is more accurate then the alternative of simply changing the temperature settings of the heater.


![cascade_flow](../images/node-ps-strategy-heat-capacitor-cascade-control.png)


![Cascade](https://deltamotion.com/support/webhelp/rmctools/Controller_Features/Control_Modes/Advanced_Control/CascadeLoop.png)

The example utilizes a PID controller to provide a number between 0 and 1 to indicate a load on the heater

 A cascade temperature controller is a controller which utelizes the input/setpoints of other controllers/climate entities to regulate to its own setpoint

The heat capacitor strategy utilizes a large body of mass, like your house or cabin, to procure heat at a time where electricity is cheap, and divest at a time where electricity is expensive.

This is achieved by increasing the temperature setpoint of one or several climate entities at times when electricity is cheap, and reducing it when electricity is expensive.

It is a good application for cabins/heated storage spaces, as the entity never actually shuts off the climate entities and should therefore be rather safe to apply (still at you own risk :-)). It can also be used for you house, jacuzzi, and/or pool.

![Temperature profile vs. cost](../images/heat-capacitor-temperatureVsPrice.png)

---
## Requirements:
> Home assistant integrated with Node-RED

> Tibber node installed and correctly configured

> A climate entity

## Instructions:
> Create an "input_number" entity in Home Assistant

> Import the flow into Node-RED

> Configure the heat-capacitor node:
  - Insert an approximate time it takes to increase the temperature by 1 Centigrade (could be 90 minutes)
  - Insert an approximate time it takes to decrease 1 Centigrade
  - Insert minimum savings for a heating/cooling cycle (should usually not be zero, as a cycle might have a cost)
> Configure the climate service to target the correct climate entity (this has to be edited in two places)
  - Change `Entity Id` in the properties menu
  - Change the `entity_id` vaule in the `Data` property

---
## Flow

![Simple example with Tibber](../images/node-ps-strategy-heat-capacitor-simple-flow-example.png)

---


```json:no-line-numbers
[{"id":"29fde6c61057362b","type":"tab","label":"PID Controller - cascade","disabled":false,"info":"","env":[]},{"id":"61ae0bee1a382102","type":"server-state-changed","z":"29fde6c61057362b","name":"Setpoint","server":"e2dd69fb.8f70a8","version":3,"exposeToHomeAssistant":false,"haConfig":[{"property":"name","value":""},{"property":"icon","value":""}],"entityidfilter":"input_number.setpunkt_temp_stue","entityidfiltertype":"exact","outputinitially":true,"state_type":"num","haltifstate":"","halt_if_type":"str","halt_if_compare":"is","outputs":1,"output_only_on_state_change":false,"for":0,"forType":"num","forUnits":"minutes","ignorePrevStateNull":false,"ignorePrevStateUnknown":false,"ignorePrevStateUnavailable":false,"ignoreCurrentStateUnknown":true,"ignoreCurrentStateUnavailable":true,"outputProperties":[{"property":"payload","propertyType":"msg","value":"","valueType":"entityState"},{"property":"data","propertyType":"msg","value":"","valueType":"eventData"},{"property":"topic","propertyType":"msg","value":"","valueType":"triggerId"}],"x":120,"y":100,"wires":[["f8958d382348c254"]]},{"id":"ef1c6050d6de41c7","type":"server-state-changed","z":"29fde6c61057362b","name":"Temp. sensor","server":"e2dd69fb.8f70a8","version":3,"exposeToHomeAssistant":false,"haConfig":[{"property":"name","value":""},{"property":"icon","value":""}],"entityidfilter":"sensor.kjokken_temp","entityidfiltertype":"exact","outputinitially":true,"state_type":"num","haltifstate":"","halt_if_type":"str","halt_if_compare":"is","outputs":1,"output_only_on_state_change":false,"for":0,"forType":"num","forUnits":"seconds","ignorePrevStateNull":false,"ignorePrevStateUnknown":false,"ignorePrevStateUnavailable":false,"ignoreCurrentStateUnknown":true,"ignoreCurrentStateUnavailable":true,"outputProperties":[{"property":"payload","propertyType":"msg","value":"","valueType":"entityState"},{"property":"data","propertyType":"msg","value":"","valueType":"eventData"},{"property":"topic","propertyType":"msg","value":"","valueType":"triggerId"}],"x":130,"y":160,"wires":[["ee1904546f36bdcb"]]},{"id":"f8958d382348c254","type":"function","z":"29fde6c61057362b","name":"Specify topic","func":"msg.topic = \"setpoint\"\nflow.set('setpoint',msg.payload)\nreturn msg","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":270,"y":100,"wires":[["6f77dd60c21180e1"]]},{"id":"6f77dd60c21180e1","type":"PID","z":"29fde6c61057362b","name":"","setpoint":"7","pb":"0.6","ti":"3600","td":"900","integral_default":0.5,"smooth_factor":"2","max_interval":"600","enable":1,"disabled_op":0,"x":430,"y":140,"wires":[["ea6adedb7e2fc14e"]]},{"id":"ea6adedb7e2fc14e","type":"function","z":"29fde6c61057362b","name":"Calc oven setpoint","func":"msg.load = msg.payload\n//Max adjustment is +-5 degrees\ntemp = flow.get('setpoint')+ 5 * 2 * (msg.load-0.5)\n//Some ovens have max and min temperature settings\nif(temp<5) {temp=5.0;}\nif(temp>30) {temp=30.0;}\n//Many ovens cannot deal with decimals.\ntemp = Math.round(temp)\nmsg.heater_setpoint=temp\nreturn msg","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":590,"y":140,"wires":[["45925567a1177d5b"]]},{"id":"5fa07ec0c1842823","type":"api-current-state","z":"29fde6c61057362b","name":"Current climate settings","server":"e2dd69fb.8f70a8","version":3,"outputs":1,"halt_if":"","halt_if_type":"str","halt_if_compare":"is","entity_id":"climate.kjokkenstua","state_type":"str","blockInputOverrides":false,"outputProperties":[{"property":"payload","propertyType":"msg","value":"","valueType":"entityState"},{"property":"data","propertyType":"msg","value":"","valueType":"entity"}],"for":0,"forType":"num","forUnits":"minutes","x":950,"y":140,"wires":[["ba7e48582e04c14c","0a7c09c92a01178e"]]},{"id":"ba7e48582e04c14c","type":"switch","z":"29fde6c61057362b","name":"Not same?","property":"data.attributes.temperature","propertyType":"msg","rules":[{"t":"neq","v":"heater_setpoint","vt":"msg"}],"checkall":"true","repair":false,"outputs":1,"x":1150,"y":140,"wires":[["1114bb7e63d16e98","0a7c09c92a01178e"]]},{"id":"1114bb7e63d16e98","type":"api-call-service","z":"29fde6c61057362b","name":"Sett temperatur","server":"e2dd69fb.8f70a8","version":3,"debugenabled":false,"service_domain":"climate","service":"set_temperature","entityId":"climate.kjokkenstua","data":"{\"entity_id\":\"climate.kjokkenstua\",\"temperature\":\"{{heater_setpoint}}\"}","dataType":"json","mergecontext":"","mustacheAltTags":false,"outputProperties":[],"queue":"none","x":1320,"y":140,"wires":[[]]},{"id":"45925567a1177d5b","type":"api-current-state","z":"29fde6c61057362b","name":"Enabled?","server":"e2dd69fb.8f70a8","version":3,"outputs":2,"halt_if":"true","halt_if_type":"bool","halt_if_compare":"is","entity_id":"input_boolean.varmeregulering_stue","state_type":"habool","blockInputOverrides":false,"outputProperties":[{"property":"enabled","propertyType":"msg","value":"","valueType":"entityState"},{"property":"data","propertyType":"msg","value":"","valueType":"entity"}],"for":0,"forType":"num","forUnits":"minutes","x":760,"y":140,"wires":[["5fa07ec0c1842823"],[]]},{"id":"0a7c09c92a01178e","type":"debug","z":"29fde6c61057362b","name":"","active":false,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":1330,"y":240,"wires":[]},{"id":"ee1904546f36bdcb","type":"delay","z":"29fde6c61057362b","name":"","pauseType":"delay","timeout":"100","timeoutUnits":"milliseconds","rate":"1","nbRateUnits":"1","rateUnits":"second","randomFirst":"1","randomLast":"5","randomUnits":"seconds","drop":false,"allowrate":false,"outputs":1,"x":290,"y":160,"wires":[["6f77dd60c21180e1"]]},{"id":"e2dd69fb.8f70a8","type":"server","name":"Home Assistant","version":2,"addon":true,"rejectUnauthorizedCerts":true,"ha_boolean":"y|yes|true|on|home|open","connectionDelay":false,"cacheJson":true,"heartbeat":true,"heartbeatInterval":"30"}]
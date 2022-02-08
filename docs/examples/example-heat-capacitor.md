# Simple heat capacitor strategy flow 

## Description

The heat capacitor strategy utilizes a large body of mass, like your house or cabin, to procure heat at a time where electricity is cheap, and divest at a time where electricity is expensive.

This is achieved by increasing the temperature setpoint of one or several climate entities at times when electricity is cheap, and reducing it when electricity is expensive.

It is a good application for cabins/heated storage spaces, as the entity never actually shuts off the climate entities and should therefore be rather safe to apply (still at you own risk :-)). It can also be used for you house, jacuzzi, and/or pool.

![Temperature profile vs. cost](../images/heat-capacitor-temperatureVsPrice.png)

---

## Requirements

> Home assistant integrated with Node-RED

> Tibber node installed and correctly configured

> A climate entity

## Instructions

> Create an `input_number` entity in Home Assistant named `setpoint`

> Import the flow into Node-RED

> Configure the heat-capacitor node:
  - Insert an approximate time it takes to increase the temperature by 1 Centigrade (could be 90 minutes)
  - Insert an approximate time it takes to decrease 1 Centigrade
  - Insert minimum savings for a heating/cooling cycle (should not be zero, as a cycle might have a cost)

> Configure the climate service to target the correct climate entity (this has to be edited in two places)
  - Change `Entity Id` in the properties menu
  - Change the `entity_id` value in the `Data` property

> (optional) If the `input_number` entity was named something else than `setpoint`, change the `entity_id` of the `Setpoint` node accordingly.

### Advanced set-up

> Replace the `Set temperature` node with a [Cascade controller](./example-cascade-temperature-control.md) to improve the heaters accuracy and response time.

---

## Flow

![Simple example with Tibber](../images/node-ps-strategy-heat-capacitor-simple-flow-example.png)

---


::: details [Flow code]

```json:no-line-numbers
[
    {
        "id": "135c4e7649611314",
        "type": "tab",
        "label": "PowerSaver",
        "disabled": false,
        "info": "",
        "env": []
    },
    {
        "id": "cf5908a52e0aee5e",
        "type": "ps-receive-price",
        "z": "135c4e7649611314",
        "name": "Price Receiver",
        "x": 400,
        "y": 320,
        "wires": [
            [
                "b7b85590b7d28ba6"
            ]
        ]
    },
    {
        "id": "b08bc12bf8734c5a",
        "type": "tibber-query",
        "z": "135c4e7649611314",
        "name": "",
        "active": true,
        "apiEndpointRef": "9ea07b03b88cb526",
        "x": 230,
        "y": 320,
        "wires": [
            [
                "cf5908a52e0aee5e"
            ]
        ]
    },
    {
        "id": "d0d4dd31efe67e85",
        "type": "inject",
        "z": "135c4e7649611314",
        "name": "",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "60",
        "crontab": "",
        "once": true,
        "onceDelay": "1",
        "topic": "",
        "payload": "{   viewer {     homes {       currentSubscription {         priceInfo {           today {             total             startsAt           }           tomorrow {             total             startsAt           }         }       }     }   } }",
        "payloadType": "str",
        "x": 90,
        "y": 320,
        "wires": [
            [
                "b08bc12bf8734c5a"
            ]
        ]
    },
    {
        "id": "4831f393a0066565",
        "type": "api-call-service",
        "z": "135c4e7649611314",
        "name": "Set temperature",
        "server": "e2dd69fb.8f70a8",
        "version": 3,
        "debugenabled": false,
        "service_domain": "climate",
        "service": "set_temperature",
        "entityId": "climate.my_climate",
        "data": "{\"entity_id\":\"climate.my_climate\",\"temperature\":\"{{adj_setpoint}}\"}",
        "dataType": "json",
        "mergecontext": "",
        "mustacheAltTags": false,
        "outputProperties": [],
        "queue": "none",
        "x": 980,
        "y": 320,
        "wires": [
            []
        ]
    },
    {
        "id": "027f4267d969e1b8",
        "type": "server-state-changed",
        "z": "135c4e7649611314",
        "name": "Setpoint",
        "server": "e2dd69fb.8f70a8",
        "version": 3,
        "exposeToHomeAssistant": false,
        "haConfig": [
            {
                "property": "name",
                "value": ""
            },
            {
                "property": "icon",
                "value": ""
            }
        ],
        "entityidfilter": "input_number.setpoint",
        "entityidfiltertype": "exact",
        "outputinitially": true,
        "state_type": "num",
        "haltifstate": "",
        "halt_if_type": "str",
        "halt_if_compare": "is",
        "outputs": 1,
        "output_only_on_state_change": false,
        "for": 0,
        "forType": "num",
        "forUnits": "minutes",
        "ignorePrevStateNull": false,
        "ignorePrevStateUnknown": false,
        "ignorePrevStateUnavailable": false,
        "ignoreCurrentStateUnknown": true,
        "ignoreCurrentStateUnavailable": true,
        "outputProperties": [
            {
                "property": "payload.config.setpoint",
                "propertyType": "msg",
                "value": "",
                "valueType": "entityState"
            },
            {
                "property": "data",
                "propertyType": "msg",
                "value": "",
                "valueType": "eventData"
            },
            {
                "property": "topic",
                "propertyType": "msg",
                "value": "",
                "valueType": "triggerId"
            }
        ],
        "x": 420,
        "y": 360,
        "wires": [
            [
                "b7b85590b7d28ba6"
            ]
        ]
    },
    {
        "id": "b7b85590b7d28ba6",
        "type": "ps-strategy-heat-capacitor",
        "z": "135c4e7649611314",
        "name": "Heat capacitor",
        "timeHeat1C": "70",
        "timeCool1C": 50,
        "maxTempAdjustment": "1",
        "boostTempHeat": "2",
        "boostTempCool": "2",
        "minSavings": 0.08,
        "setpoint": 23,
        "x": 600,
        "y": 320,
        "wires": [
            [
                "2b7cbdef3203a482"
            ],
            [],
            []
        ]
    },
    {
        "id": "2b7cbdef3203a482",
        "type": "function",
        "z": "135c4e7649611314",
        "name": "Adjust setpoint",
        "func": "//In case the climate entity can only handle integers\n//Calculate rounded setpoint for the climate entity and return the msg\nmsg.adj_setpoint=Math.round(msg.payload);\nreturn msg\n",
        "outputs": 1,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 800,
        "y": 320,
        "wires": [
            [
                "4831f393a0066565"
            ]
        ]
    },
    {
        "id": "9ea07b03b88cb526",
        "type": "tibber-api-endpoint",
        "feedUrl": "wss://api.tibber.com/v1-beta/gql/subscriptions",
        "queryUrl": "https://api.tibber.com/v1-beta/gql",
        "name": "Tibber"
    },
    {
        "id": "e2dd69fb.8f70a8",
        "type": "server",
        "name": "Home Assistant",
        "version": 2,
        "addon": false,
        "rejectUnauthorizedCerts": true,
        "ha_boolean": "y|yes|true|on|home|open",
        "connectionDelay": false,
        "cacheJson": true,
        "heartbeat": false,
        "heartbeatInterval": 30
    }
]
```
:::

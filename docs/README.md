---
home: true
heroImage: /logo.png
heroHeight: 112
heroAlt: Power Saver
heroText: node-red-contrib-power-saver
tagline: A collection of nodes to Node-RED that automates saving money on variable electricity prices
actions:
  - text: Guide
    link: /guide/
    type: primary
  - text: Nodes
    link: /nodes/
    type: primary
  - text: Examples
    link: /examples/
    type: primary
features:
  - title: Light control
    details: Light Saver node for advanced fully automated motion based light control
  - title: Automatic scheduling
    details: Automatically calculate best plan and send signal to turn on and off.
  - title: Multiple strategies
    details: Different strategies for different purposes. See Best Save, Lowest Price and Heat Capacitor.
  - title: Grid Capacity Optimization
    details: Automatically turn off consumption to avoid breaking capacity limits.
  - title: 15 minute price intervals
    details: Supports 15 minutes price intervals and schedules can be defined with minute resolution.
  - title: Perfect with Home Assistant
    details: Use Home Assistant with Node-RED and control switches via service calls.
  - title: Tibber and Nord Pool
    details: Painlessly use prices received from Tibber or Nord Pool.
footer: Created by Otto Paulsen and contributors

footerHtml: true
---

::: tip New Light Saver node
A brand new [node](/nodes/ps-light-saver.html#ps-light-saver) gives you powerful control of smart lights. Have lights turn on before you enter the room. Keep them on as long as there os motion. Turn them off quickly if you did not enter the room. Set different default levels at different times of day. Keep off at night. Keep your manual adjustments until you leave. Try it out!
:::

::: warning PowerSaver 5 beta
PowerSaver version 5 with support for 15 minutes price intervals has been pre-released. The version has been tested for some time now and seems pretty stable, but there are probably still some issues. Use it at your own risk (but that goes for any version anyway). Please report bugs as github issues.

This documentation is for version 5!
:::

This is a collection of nodes for the popular [Node-RED](https://nodered.org/) that you can use to save money on variable electricity prices. Node-RED is a widely used low-code programming tool that can be used together with many smart home solutions to create automations.

Please remember to take a look at our [privacy rules](./privacy.md).
<br/>
<br/>
<br/>

<DonateButtons/>

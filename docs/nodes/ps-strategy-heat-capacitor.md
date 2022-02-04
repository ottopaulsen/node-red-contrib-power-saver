# ps-strategy-heat-capacitor 

![ps-strategy-lowest-price](../images/node-ps-strategy-heat-capacitor.png)

A strategy for moving consumption from expensive to cheap periods utilising climate entities.

## Description

The heat capacitor strategy utilizes a large body of mass, like your house or cabin, to procure heat at a time where electricity is cheap, and divest at a time where electricity is expensive.

This is achieved by increasing the temperature setpoint of one or several climate entities at times when electricity is cheap, and reducing it when electricity is expensive.

It is a good application for cabins/heated storage spaces, as the entity never actually shuts off the climate entities and should therefore be rather safe to apply (still at you own risk :-)). It can also be used for you house, jacuzzi, and/or pool.

![Temperature profile vs. cost](../images/heat-capacitor-temperatureVsPrice.png)

## Configuration

![Node Configuration](../images/temperature-manipulation-config.png)

| Value                  | Description
| ---------------------- |----------------------------------------------- 
| Time + 1C              | The time required to increate the temperature by 1C.
| Time - 1C              | The time required to decrease the temperature by 1C.
| Max temp adj.          | The number of degrees the system is allowed to increase/decrease.
| Min Savings            | The minimum amount of savings required for a buy/sell cycle.


![Simple example with Tibber](../images/node-ps-strategy-heat-capacitor-simple-flow-example.png)

The node consumes price information and outputs $\Delta T$ on its first output and the planned schedule and benefit calculations on the secound output. The $\Delta T$ is used to adjust the set-point of a climate entity.

### The impact of **Time +1C**

This time is used to optimize the timing of when to turn up the heat. An increase in temperature from 22 to 23C will cause an increased electricity consumption for quite some time after the change has occured. For heat-pumps, the air is heated first, then walls, furniture etc., creating a high electricity demand in the first hour or so before the demand slowly reduces down to normal levels. The algorithm uses this time to estimate a period of increased consumption and places this at an optimum point in time.

To get started, 90 minutes can be used for air heaters. Later, one can study the temperature curves or, if available, the power consumption curves of the climate entity, to achieve a better accuracy.

### Max temperature adjustment

A value of 0.65 will change the setpoint temperature by $\pm0.65$. Please note that a larger number will indicate a longer heating time (Time +1C = 60 and Max Temp Adj.= 0.75 results in a heating time of $60\times0.75\times 2= 90$ minutes

### Min Savings

The heating and cooling periods can be seen as buy - sell pairs. That is, heat is procured at time t, and the same heat is sold at t+dt. The savings can then be estimated as the price difference $S=price(t+dt) - price(t)$. If this saving is less that the minimum savings requirement, it will be removed. The algorithm removes these in a prioritized order, starting with the pair with the smallest gain.


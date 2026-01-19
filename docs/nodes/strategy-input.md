# Strategy input format

The common input for strategy nodes is a payload with a `priceData` array containing an object for each period. Each object has a `value` which is the price, and a `start` which is the start time for the period. The last item in the array must also have an end property saying how long the vqlue lasts.



Example:

```json
{
  "priceData": [
    {
      "value": 0.9544,
      "start": "2021-12-07T00:00:00.000+01:00"
    },
    {
      "value": 0.8973,
      "start": "2021-12-07T01:00:00.000+01:00"
    },
    {
      "value": 0.8668,
      "start": "2021-12-07T01:15:00.000+01:00"
    },
    {
      "value": 0.8683,
      "start": "2021-12-07T01:30:00.000+01:00"
    },
    //...
    {
      "value": 0.8942,
      "start": "2021-12-07T04:00:00.000+01:00",
      "end": "2021-12-08T00:00:00.000+01:00"
    }
  ]
}
```

This format is used for:

- Output of the `ps-receive-price` node
- Input and output of the `ps-xxx-add-tariff` nodes
- Input for the strategy nodes (`ps-strategy-xxx-xxx`)

###



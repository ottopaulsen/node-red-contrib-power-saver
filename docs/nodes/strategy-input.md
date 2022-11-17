# Strategy input format

The common input for strategy nodes is a payload with a `priceData` array containing an object for each hour. Each object has a `value` which is the price, and a `start` which is the start time for the hour.

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
      "start": "2021-12-07T02:00:00.000+01:00"
    },
    {
      "value": 0.8683,
      "start": "2021-12-07T03:00:00.000+01:00"
    },
    {
      "value": 0.8942,
      "start": "2021-12-07T04:00:00.000+01:00"
    }
    // ... normally 24 or 48 hours
  ]
}
```

This format is used for:

- Output of the `ps-receive-price` node
- Input and output of the `ps-xxx-add-tariff` nodes
- Input for the strategy nodes (`ps-strategy-xxx-xxx`)

###

<AdsenseAdd type="nederst"/>

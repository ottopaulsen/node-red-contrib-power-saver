# Reduce minutes array

If you want to reduce number of entries in the minutes array on output 3, you can send it through a function node with the following code:
```
const minutes = []
let previousHour = ""
let previousSaving = null
let previousPrice = null
msg.payload.minutes.forEach(m => {
  const hour = m.start.substring(0, 13)
  if (hour !== previousHour || m.saving !== previousSaving || m.price !== previousPrice) {
    minutes.push(m)
    previousHour = hour
    previousSaving = m.saving
    previousPrice = m.price
  }
})

msg.payload.minutes = minutes

return msg;
```
It will remove all entries that are equal to the one before, but still send at least one per hour.

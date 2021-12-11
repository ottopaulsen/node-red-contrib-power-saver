const expect = require("expect");
const { convertMsg } = require("../src/receive-price-functions");

describe("receive-price-functions", () => {
  it("can convert input msg", () => {
    const msgStd = {
      payload: {
        today: [
          { value: 1, start: "2021-06-21T00:00:00+02:00" },
          { value: 2, start: "2021-06-21T01:00:00+02:00" },
        ],
        tomorrow: [
          { value: 3, start: "2021-06-22T00:00:00+02:00" },
          { value: 4, start: "2021-06-22T01:00:00+02:00" },
        ],
      },
    };
    const msgStdTodayOnly = {
      payload: {
        today: [
          { value: 1, start: "2021-06-21T00:00:00+02:00" },
          { value: 2, start: "2021-06-21T01:00:00+02:00" },
        ],
        tomorrow: [],
      },
    };
    const msgNordpool = {
      data: {
        new_state: {
          attributes: {
            raw_today: [
              { value: 1, start: "2021-06-21T00:00:00+02:00" },
              { value: 2, start: "2021-06-21T01:00:00+02:00" },
            ],
            raw_tomorrow: [
              { value: 3, start: "2021-06-22T00:00:00+02:00" },
              { value: 4, start: "2021-06-22T01:00:00+02:00" },
            ],
          },
        },
      },
    };
    const msgTibber = {
      payload: {
        viewer: {
          homes: [
            {
              currentSubscription: {
                priceInfo: {
                  current: {
                    total: 0.6411,
                    energy: 0.505,
                    tax: 0.1361,
                    startsAt: "2021-06-21T00:00:00+02:00",
                  },
                  today: [
                    {
                      total: 1,
                      energy: 0.5051,
                      tax: 0.1361,
                      startsAt: "2021-06-21T00:00:00+02:00",
                    },
                    {
                      total: 2,
                      energy: 0.5016,
                      tax: 0.1353,
                      startsAt: "2021-06-21T01:00:00+02:00",
                    },
                  ],
                  tomorrow: [
                    {
                      total: 3,
                      energy: 0.4521,
                      tax: 0.1229,
                      startsAt: "2021-06-22T00:00:00+02:00",
                    },
                    {
                      total: 4,
                      energy: 0.4488,
                      tax: 0.1221,
                      startsAt: "2021-06-22T01:00:00+02:00",
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    };

    const msgTibberSingle = {
      payload: {
        viewer: {
          home: {
            currentSubscription: {
              priceInfo: {
                today: [
                  {
                    total: 1,
                    startsAt: "2021-06-21T00:00:00+02:00",
                  },
                  {
                    total: 2,
                    startsAt: "2021-06-21T01:00:00+02:00",
                  },
                ],
                tomorrow: [
                  {
                    total: 3,
                    startsAt: "2021-06-22T00:00:00+02:00",
                  },
                  {
                    total: 4,
                    startsAt: "2021-06-22T01:00:00+02:00",
                  },
                ],
              },
            },
          },
        },
      },
    };

    expect(convertMsg(msgStd)).toEqual({ source: "Other", ...msgStd.payload });
    expect(convertMsg(msgTibber)).toEqual({
      source: "Tibber",
      ...msgStd.payload,
    });
    expect(convertMsg(msgTibberSingle)).toEqual({
      source: "Tibber",
      ...msgStd.payload,
    });
    expect(convertMsg(msgNordpool)).toEqual({
      source: "Nordpool",
      ...msgStd.payload,
    });
    msgTibber.payload.viewer.homes[0].currentSubscription.priceInfo.tomorrow = [];
    expect(convertMsg(msgTibber)).toEqual({
      source: "Tibber",
      ...msgStdTodayOnly.payload,
    });
    msgNordpool.data.new_state.attributes.raw_tomorrow = [];
    expect(convertMsg(msgNordpool)).toEqual({
      source: "Nordpool",
      ...msgStdTodayOnly.payload,
    });
    expect(convertMsg(msgStdTodayOnly)).toEqual({
      source: "Other",
      ...msgStdTodayOnly.payload,
    });
  });
});

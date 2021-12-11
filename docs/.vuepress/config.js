module.exports = {
  lang: "en-US",
  title: "Power Saver",
  description: "A Node-RED note to save money on hourly changing power prices",

  themeConfig: {
    navbar: [
      {
        text: "Guide",
        link: "/guide/",
      },
      {
        text: "Nodes",
        link: "/nodes/",
      },
      {
        text: "Examples",
        link: "/examples/",
      },
      {
        text: "Contribute",
        link: "/contribute/",
      },
    ],
    sidebar: {
      "/guide/": [{ text: "Guide", children: ["/guide/README.md"] }],
      "/nodes/": [
        {
          text: "Nodes",
          children: [
            "/nodes/power-saver.md",
            "/nodes/ps-strategy-best-save.md",
            "/nodes/ps-strategy-lowest-price.md",
            "/nodes/ps-receive-price.md",
            "/nodes/ps-elvia-add-tariff.md",
          ],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          children: [
            "/examples/example-nordpool-current-state.md",
            "/examples/example-nordpool-events-state.md",
            "/examples/example-tibber-mqtt.md",
          ],
        },
      ],
      "/contribute/": [
        {
          text: "Contribute",
          children: ["/contribute/README.md"],
        },
      ],
    },
  },
  head: [
    ["script", { src: "https://c6.patreon.com/becomePatronButton.bundle.js" }],
    ["link", { rel: "icon", href: "/euro.png" }],
  ],
};

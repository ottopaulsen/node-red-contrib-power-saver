const { path } = require("@vuepress/utils");
module.exports = {
  lang: "en-US",
  title: "Power Saver",
  description: "A Node-RED note to save money on hourly changing power prices",
  base: "/",
  themeConfig: {
    contributors: false,
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
        text: "FAQ",
        link: "/faq/",
      },
      {
        text: "Contribute",
        link: "/contribute/",
      },
      {
        text: "Changes",
        link: "/changelog/",
      },
      {
        text: "GitHub",
        link: "https://github.com/ottopaulsen/node-red-contrib-power-saver",
      },
    ],
    sidebar: {
      "/guide/": [{ text: "Guide", children: ["/guide/README.md"] }],
      "/nodes/": [
        {
          text: "Nodes",
          children: [
            { text: "Power Saver", link: "/nodes/power-saver.md" },
            {
              text: "Strategy nodes",
              children: [
                "/nodes/ps-strategy-best-save.md",
                "/nodes/ps-strategy-lowest-price.md",
                { text: "ps-strategy-heat-capacitor", link: "/nodes/ps-strategy-heat-capacitor.md" },
              ],
            },
            { text: "Utility nodes", children: ["/nodes/ps-receive-price.md"] },
            {
              text: "Grid tariff nodes",
              children: ["/nodes/ps-general-add-tariff.md", "/nodes/ps-elvia-add-tariff.md"],
            },
          ],
        },
        {
          text: "Data format",
          children: ["/nodes/strategy-input.md"],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          children: [
            "/examples/example-nordpool-current-state.md",
            "/examples/example-nordpool-events-state.md",
            "/examples/example-tibber-mqtt.md",
            "/examples/example-heat-capacitor.md",
            "/examples/example-cascade-temperature-control.md",
          ],
        },
      ],
      "/faq/": [{ text: "FAQ", children: ["/faq/README.md"] }],
      "/contribute/": [{ text: "Contribute", children: ["/contribute/README.md"] }],
      "/changelog/": [{ text: "Changelog", children: ["/changelog/README.md"] }],
    },
  },
  head: [
    ["link", { rel: "shortcut icon", type: "image/x-icon", href: "euro.png" }],
    [
      "script",
      {
        async: true,
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9857859182772006",
        crossorigin: "anonymous",
      },
    ],
  ],
  plugins: [
    [
      "@vuepress/register-components",
      {
        components: {
          BestSaveVerificator: path.resolve(__dirname, "./components/BestSaveVerificator.vue"),
          DonateButtons: path.resolve(__dirname, "./components/DonateButtons.vue"),
        },
      },
    ],
  ],
};

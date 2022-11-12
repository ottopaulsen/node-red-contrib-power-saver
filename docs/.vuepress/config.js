const { path } = require("@vuepress/utils");
const navbar = require("./navbar");

module.exports = {
  lang: "en-US",
  title: "Power Saver",
  description: "A Node-RED node collection to save money on hourly changing power prices",
  base: "/",
  themeConfig: {
    contributors: false,
    logo: "/Ukraine-heart-shape-flag.png",
    navbar,
    sidebar: {
      "/guide/": [{ text: "Guide", children: ["/guide/README.md"] }],
      "/nodes/": [
        {
          text: "Nodes",
          children: [
            {
              text: "Strategy nodes",
              children: [
                "/nodes/ps-strategy-best-save.md",
                "/nodes/ps-strategy-lowest-price.md",
                "/nodes/ps-strategy-heat-capacitor.md",
                "/nodes/ps-strategy-fixed-schedule.md",
              ],
            },
            { text: "Utility nodes", children: ["/nodes/ps-receive-price.md", "/nodes/ps-schedule-merger.md"] },
            {
              text: "Grid tariff nodes",
              children: ["/nodes/ps-general-add-tariff.md", "/nodes/ps-elvia-add-tariff.md"],
            },
          ],
        },
        {
          text: "Node features",
          children: ["/nodes/strategy-input.md", "/nodes/dynamic-config.md", "/nodes/dynamic-commands.md"],
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
            "/examples/example-visualize-on-off/example-visualize-on-off.md",
            "/examples/example-grid-tariff-capacity-part.md",
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
        crossorigin: "anonymous",
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9857859182772006",
      },
    ],
  ],
  plugins: [
    [
      "@vuepress/register-components",
      {
        componentsDir: path.resolve(__dirname, "./components"),
      },
    ],
    ["@vuepress/plugin-search"],
    ["@vuepress/google-analytics", { id: "G-Z2QNNCDQZG" }],
  ],
};

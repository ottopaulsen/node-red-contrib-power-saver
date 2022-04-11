const { path } = require("@vuepress/utils");
const navbar = require("./navbar");

module.exports = {
  lang: "en-US",
  title: "Power Saver",
  description: "A Node-RED note to save money on hourly changing power prices",
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
            { text: "Power Saver", link: "/nodes/power-saver.md" },
            {
              text: "Strategy nodes",
              children: [
                "/nodes/ps-strategy-best-save.md",
                "/nodes/ps-strategy-lowest-price.md",
                {
                  text: "ps-strategy-heat-capacitor",
                  link: "/nodes/ps-strategy-heat-capacitor.md",
                },
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
  head: [["link", { rel: "shortcut icon", type: "image/x-icon", href: "euro.png" }]],
  plugins: [
    [
      "@vuepress/register-components",
      {
        componentsDir: path.resolve(__dirname, "./components"),
      },
    ],
  ],
};

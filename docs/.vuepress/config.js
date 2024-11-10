import navbar from "./navbar";
import { path } from "@vuepress/utils";
import { registerComponentsPlugin } from "@vuepress/plugin-register-components";
import { searchPlugin } from "@vuepress/plugin-search";

import { defaultTheme } from "@vuepress/theme-default";
import { defineUserConfig } from "vuepress";
import {viteBundler} from "@vuepress/bundler-vite"

export default defineUserConfig({
  base: "/",
  bundler: viteBundler({}),
  description: "A Node-RED node collection to save money on hourly changing power prices",
  head: [
    ["link", { rel: "shortcut icon", type: "image/x-icon", href: "euro.png" }],
    // [
    //   "script",
    //   {
    //     async: true,
    //     crossorigin: "anonymous",
    //     src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9857859182772006",
    //   },
    // ],
  ],
  lang: "en-US",
  plugins: [
    registerComponentsPlugin({ componentsDir: path.resolve(__dirname, "./components") }),
    searchPlugin({}),
    // googleAnalyticsPlugin({
    //   id: "G-Z2QNNCDQZG",
    // }),
  ],
  theme: defaultTheme({
    contributors: false,
    logo: "/ps-logo.png",
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
            "/examples/example-stromstotte.md",
          ],
        },
      ],
      "/faq/": [{ text: "FAQ", children: ["/faq/README.md"] }],
      "/contribute/": [{ text: "Contribute", children: ["/contribute/README.md"] }],
      "/changelog/": [{ text: "Changelog", children: ["/changelog/README.md"] }],
    },
  }),
  title: "PowerSaver"
});

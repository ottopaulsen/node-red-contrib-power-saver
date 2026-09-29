const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.es2021,
      },
    },
  },
  {
    // Everything that runs in Node: the nodes themselves, the tests and the
    // VuePress build-time config. Scoped so that no-undef still catches
    // process/Buffer/__dirname in the browser-side files below.
    files: ["src/**/*.js", "test/**/*.js", "*.cjs", "docs/.vuepress/config.js", "docs/.vuepress/navbar.js"],
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
      },
    },
  },
  {
    // VuePress client code is shipped to the browser.
    files: ["docs/.vuepress/client.js", "docs/.vuepress/clientAppEnhance.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    // Mocha injects describe/it/before/beforeEach/after/afterEach into the
    // test files, so without these they all report as no-undef.
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },
];

import { defineClientConfig } from "@vuepress/client";
import FloatingVue from "floating-vue";
import "floating-vue/dist/style.css";

export default defineClientConfig({
  rootComponents: [FloatingVue],
});

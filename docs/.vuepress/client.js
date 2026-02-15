import { defineClientConfig } from "@vuepress/client";
import FloatingVue from "floating-vue";
import "floating-vue/dist/style.css";
import "./styles/index.css";

export default defineClientConfig({
  rootComponents: [FloatingVue],
});

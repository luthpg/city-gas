import { createApp } from "vue";
import App from "./App.vue";
import { createRouter } from "@ciderjs/city-gas";
import { createRouterPlugin } from "@ciderjs/city-gas/vue";
import { pages } from "./.generated/routes";
import type { RouteNames, RouteParams } from "./.generated/router";

const router = createRouter<RouteNames, RouteParams>(pages, {
  defaultRouteName: "",
});

createApp(App).use(createRouterPlugin(router)).mount("#app");

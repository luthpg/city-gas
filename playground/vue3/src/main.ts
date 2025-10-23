import { createApp } from "vue";
import App from "./App.vue";
import { createRouter } from "@ciderjs/city-gas";
import { createRouterPlugin } from "@ciderjs/city-gas/vue";
import { pages } from "./generated/routes";
import type { RouteNames, RouteParams } from "./generated/router";

async function main() {
  const router = await createRouter<RouteNames, RouteParams>(pages as any, {
    defaultRouteName: "/",
  });

  createApp(App).use(createRouterPlugin(router)).mount("#root");
}

main();

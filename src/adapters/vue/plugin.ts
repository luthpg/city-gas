import { type App, inject, type Ref, ref } from 'vue';
import type { Route, Router } from '@/core/router';

import { routerKey } from './key';

export function createRouterPlugin<R extends string, P extends Record<R, any>>(
  router: Router<R, P>,
) {
  return {
    install(app: App) {
      const route = ref(router.getCurrentRoute());

      app.provide(RouterSymbol, {
        router,
        route,
      });

      router.subscribe((r) => {
        route.value = r;
      });
    },
  };
}

export function useRouterContext<R extends string, P extends Record<R, any>>() {
  const ctx = inject(routerKey);
  if (!ctx) throw new Error('city-gas: must be used within RouterPlugin');
  return ctx as {
    router: Router<R, P>;
    route: Ref<Route<R, P>>;
  };
}

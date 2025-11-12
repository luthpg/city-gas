import type { App } from 'vue';
import type {
  RegisteredRouteNames,
  RegisteredRouteParams,
  Router,
} from '@/core/router';
import { routerKey } from './key';

export type RouterContext<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
> = {
  router: Router<R, P>;
};

export function createRouterPlugin<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>(router: Router<R, P>) {
  return {
    install(app: App) {
      const context: RouterContext<R, P> = { router };
      app.provide(routerKey, context);
    },
  };
}

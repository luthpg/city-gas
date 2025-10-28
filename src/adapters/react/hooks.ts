import * as React from 'react';
import { RouterContext } from '@/adapters/react/provider';
import type {
  RegisteredRouteNames,
  RegisteredRouteParams,
  Route,
  Router,
} from '@/core/router';

function useRouterContext<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>() {
  const context = React.useContext(RouterContext);
  if (!context) {
    throw new Error('useRouterContext must be used within a RouterProvider');
  }
  return context as { router: Router<R, P> };
}

function useStore<
  Snapshot,
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>(selector: (route: Route<R, P>) => Snapshot): Snapshot {
  const { router } = useRouterContext<R, P>();
  return React.useSyncExternalStore(
    router.subscribe,
    () => selector(router.getCurrentRoute()),
    () => selector(router.getCurrentRoute()),
  );
}

export function useRoute<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>(): Route<R, P> {
  return useStore<Route<R, P>, R, P>((route) => route);
}

export function useRouter<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>(): Router<R, P> {
  return useRouterContext<R, P>().router;
}

export function useNavigate<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>() {
  return useRouterContext<R, P>().router.navigate;
}

export function useParams<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>(): P[R] {
  return useStore((route) => route.params);
}

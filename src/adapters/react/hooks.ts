import React from 'react';
import { RouterContext } from '@/adapters/react/provider';
import type { Route, Router } from '@/core/router';

function useRouterContext<R extends string, P extends Record<R, any>>() {
  const context = React.useContext(RouterContext);
  if (!context) {
    throw new Error('useRouterContext must be used within a RouterProvider');
  }
  return context as { router: Router<R, P> };
}

function useStore<R extends string, P extends Record<R, any>, Snapshot>(
  selector: (route: Route<R, P>) => Snapshot,
): Snapshot {
  const { router } = useRouterContext<R, P>();
  return React.useSyncExternalStore(
    router.subscribe,
    () => selector(router.getCurrentRoute()),
    () => selector(router.getCurrentRoute()),
  );
}

export function useRoute<R extends string, P extends Record<R, any>>(): Route<
  R,
  P
> {
  return useStore<R, P, Route<R, P>>((route) => route);
}

export function useRouter<R extends string, P extends Record<R, any>>(): Router<
  R,
  P
> {
  return useRouterContext<R, P>().router;
}

export function useNavigate<R extends string, P extends Record<R, any>>() {
  return useRouterContext<R, P>().router.navigate;
}

export function useParams<R extends string, P extends Record<R, any>>(): P[R] {
  return useStore((route) => route.params);
}

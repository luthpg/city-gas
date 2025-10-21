import React from 'react';
import type { Route, Router } from '@/core/router';

type RouterContextValue<R extends string, P extends Record<R, any>> = {
  router: Router<R, P>;
  route: Route<R, P>;
};

const RouterContext = React.createContext<RouterContextValue<any, any> | null>(
  null,
);

export function RouterProvider<R extends string, P extends Record<R, any>>({
  router,
  children,
}: {
  router: Router<R, P>;
  children: React.ReactNode;
}) {
  const [route, setRoute] = React.useState<Route<R, P>>(
    router.getCurrentRoute(),
  );

  React.useEffect(() => {
    return router.subscribe((r) => setRoute(r));
  }, [router]);

  return (
    <RouterContext.Provider value={{ router, route }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouterContext<R extends string, P extends Record<R, any>>() {
  const ctx = React.useContext(RouterContext);
  if (!ctx) throw new Error('city-gas: must be used within RouterProvider');
  return ctx as RouterContextValue<R, P>;
}

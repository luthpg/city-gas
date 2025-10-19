import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Route, Router } from './router';

interface RouterContextValue<
  RouteNames extends string,
  RouteParams extends Record<RouteNames, any>,
> {
  router: Router<RouteNames, RouteParams>;
  route: Route<RouteNames, RouteParams>;
}

export const RouterContext = createContext<RouterContextValue<any, any> | null>(
  null,
);

export function useSafeContext() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('use hooks must be used within a RouterProvider');
  }
  return context;
}

export function RouterProvider<
  RouteNames extends string,
  RouteParams extends Record<RouteNames, any>,
>({
  router,
  children,
}: {
  router: Router<RouteNames, RouteParams>;
  children: React.ReactNode;
}) {
  const [route, setRoute] = useState(() => router.getCurrentRoute());

  useEffect(() => {
    const unsubscribe = router.subscribe(setRoute);
    return unsubscribe;
  }, [router]);

  return (
    <RouterContext.Provider value={{ router, route }}>
      {children}
    </RouterContext.Provider>
  );
}

export function RouterOutlet() {
  const { router, route } = useSafeContext();
  const Page = router.pages[route.name] ?? (() => <div>Not Found</div>);
  return <Page />;
}

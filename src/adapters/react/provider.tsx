import * as React from 'react';
import { RouterOutlet } from '@/adapters/react/RouterOutlet';
import type { Router } from '@/core/router';

export const RouterContext = React.createContext<{
  router: Router;
} | null>(null);

export function RouterProvider<R extends string, P extends Record<R, any>>({
  router,
  children,
}: {
  router: Router<R, P>;
  children?: React.ReactNode;
}) {
  const contextValue = React.useMemo(() => ({ router }), [router]);

  return (
    <RouterContext.Provider value={contextValue}>
      {children ?? <RouterOutlet />}
    </RouterContext.Provider>
  );
}

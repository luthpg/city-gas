// biome-ignore lint/style/useImportType: import for using jsx
import * as React from 'react';
import { useRoute, useRouter } from '@/adapters/react/hooks';
import type {
  RegisteredRouteNames,
  RegisteredRouteParams,
} from '@/core/router';

export function RouterOutlet<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>() {
  const route = useRoute<R, P>();
  const router = useRouter<R, P>();
  if (!route) return null;

  const Component = router.pages[route.name] as React.ComponentType<any>;
  if (!Component) return null;

  return <Component {...route.params} />;
}

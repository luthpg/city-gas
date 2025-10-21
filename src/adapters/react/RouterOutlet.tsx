// biome-ignore lint/style/useImportType: import for using jsx
import React from 'react';
import { useRoute, useRouter } from '@/adapters/react/hooks';

export function RouterOutlet<R extends string, P extends Record<R, any>>() {
  const route = useRoute<R, P>();
  const router = useRouter<R, P>();
  if (!route) return null;

  const Component = router.pages[route.name] as React.ComponentType<any>;
  if (!Component) return null;

  return <Component {...route.params} />;
}

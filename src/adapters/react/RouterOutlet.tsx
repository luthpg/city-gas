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

  const { name, params } = route;
  const { pages, specialPages } = router;

  const pageInfo = pages[name] as {
    component: React.ComponentType<any>;
    isIndex: boolean;
  };

  if (!pageInfo) {
    const NotFoundComponent = specialPages._404 as React.ComponentType<any>;
    if (NotFoundComponent) {
      return <NotFoundComponent />;
    }
    return <div>404 Not Found.</div>;
  }

  const { component: PageComponent, isIndex } = pageInfo;

  const pathParts = name.split('/').filter(Boolean);
  const parentPathParts = isIndex ? pathParts : pathParts.slice(0, -1);

  let LayoutComponent: React.ComponentType<any> | null = null;

  for (let i = parentPathParts.length; i > 0; i--) {
    const potentialLayoutPath = [
      ...parentPathParts.slice(0, i),
      '_layout',
    ].join('/');
    if (specialPages[potentialLayoutPath]) {
      LayoutComponent = specialPages[
        potentialLayoutPath
      ] as React.ComponentType<any>;
      break;
    }
  }

  const RootComponent = specialPages._root as React.ComponentType<any>;

  let componentToRender = <PageComponent {...params} />;

  if (LayoutComponent) {
    componentToRender = <LayoutComponent>{componentToRender}</LayoutComponent>;
  }

  if (RootComponent) {
    componentToRender = <RootComponent>{componentToRender}</RootComponent>;
  }

  return componentToRender;
}

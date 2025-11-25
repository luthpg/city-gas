import * as React from 'react';
import { DefaultLoading, DefaultNotFound } from '@/adapters/react/defaults';
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
  const isReady = React.useSyncExternalStore(
    router.subscribe,
    () => router.isReady(),
    () => router.isReady(),
  );
  const { pages, specialPages } = router;
  if (!isReady) {
    const LoadingComponent = specialPages._loading as
      | React.ComponentType<any>
      | undefined;
    return LoadingComponent ? <LoadingComponent /> : <DefaultLoading />;
  }
  if (!route) return null;

  const { name, params } = route;

  const pageInfo = pages[name] as {
    component: React.ComponentType<any>;
    isIndex: boolean;
  };

  if (!pageInfo) {
    const NotFoundComponent = specialPages._404 as React.ComponentType<any>;
    if (NotFoundComponent) {
      return <NotFoundComponent />;
    }
    return <DefaultNotFound />;
  }

  const { component: PageComponent, isIndex } = pageInfo;

  const pathParts = name.split('/').filter(Boolean);
  const parentPathParts = isIndex ? pathParts : pathParts.slice(0, -1);

  let componentToRender = <PageComponent {...params} />;

  for (let i = parentPathParts.length; i > 0; i--) {
    const potentialLayoutPath = [
      ...parentPathParts.slice(0, i),
      '_layout',
    ].join('/');
    if (specialPages[potentialLayoutPath]) {
      const LayoutComponent = specialPages[
        potentialLayoutPath
      ] as React.ComponentType<any>;
      componentToRender = (
        <LayoutComponent>{componentToRender}</LayoutComponent>
      );
    }
  }

  const RootComponent = specialPages._root as React.ComponentType<any>;

  if (RootComponent) {
    componentToRender = <RootComponent>{componentToRender}</RootComponent>;
  }

  return componentToRender;
}

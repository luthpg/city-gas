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

  const componentToRender = React.useMemo(() => {
    if (!isReady) {
      const LoadingComponent = router.specialPages._loading as
        | React.ComponentType<any>
        | undefined;
      return LoadingComponent ? <LoadingComponent /> : <DefaultLoading />;
    }
    if (!route) return null;

    const { name, params } = route;

    const pageInfo = router.pages[name] as {
      component: React.ComponentType<any>;
      isIndex: boolean;
    };

    if (!pageInfo) {
      const NotFoundComponent = router.specialPages
        ._404 as React.ComponentType<any>;
      if (NotFoundComponent) {
        return <NotFoundComponent />;
      }
      return <DefaultNotFound />;
    }

    const { component: PageComponent, isIndex } = pageInfo;

    const pathParts = name.split('/').filter(Boolean);
    const parentPathParts = isIndex ? pathParts : pathParts.slice(0, -1);

    let node = <PageComponent {...params} />;

    // Layout Nesting Logic
    for (let i = parentPathParts.length; i > 0; i--) {
      const potentialLayoutPath = [
        ...parentPathParts.slice(0, i),
        '_layout',
      ].join('/');
      if (router.specialPages[potentialLayoutPath]) {
        const LayoutComponent = router.specialPages[
          potentialLayoutPath
        ] as React.ComponentType<any>;
        node = <LayoutComponent>{node}</LayoutComponent>;
      }
    }

    const RootComponent = router.specialPages._root as React.ComponentType<any>;
    if (RootComponent) {
      node = <RootComponent>{node}</RootComponent>;
    }

    return node;
  }, [route, router, isReady]);

  return componentToRender;
}

import { getAdapter } from '@/env';
import type { Register } from '@/index';

type GetRouteNames<T> = T extends { RouteNames: infer R } ? R : string;
type GetRouteParams<T, R extends string> = T extends { RouteParams: infer P }
  ? P
  : Record<R, any>;

export type RegisteredRouteNames = GetRouteNames<Register>;
export type RegisteredRouteParams = GetRouteParams<
  Register,
  RegisteredRouteNames
>;

type Listener<
  RouteNames extends string = RegisteredRouteNames,
  RouteParams extends Record<RouteNames, any> = RegisteredRouteParams,
> = (route: Route<RouteNames, RouteParams>) => void;

export interface Route<
  RouteNames extends string = RegisteredRouteNames,
  RouteParams extends Record<RouteNames, any> = RegisteredRouteParams,
> {
  name: RouteNames;
  params: RouteParams[RouteNames];
}

export type NavigationGuardNext = (to?: string | false) => void;

export type NavigationGuard<
  RouteNames extends string = RegisteredRouteNames,
  RouteParams extends Record<RouteNames, any> = RegisteredRouteParams,
> = (
  to: Route<RouteNames, RouteParams>,
  from: Route<RouteNames, RouteParams>,
  next: NavigationGuardNext,
) => void;

export interface Router<
  RouteNames extends string = RegisteredRouteNames,
  RouteParams extends Record<RouteNames, any> = RegisteredRouteParams,
  PageComponent = unknown,
> {
  navigate: <N extends RouteNames>(
    name: N,
    ...args: [keyof RouteParams[N]] extends [never]
      ? [
          params?: RouteParams[N] | undefined | null,
          options?: { replace?: boolean },
        ]
      : [params: RouteParams[N], options?: { replace?: boolean }]
  ) => void;
  subscribe: (listener: Listener<RouteNames, RouteParams>) => () => void;
  getCurrentRoute: () => Route<RouteNames, RouteParams>;
  beforeEach: (guard: NavigationGuard<RouteNames, RouteParams>) => () => void;
  isReady: () => boolean;
  pages: Record<RouteNames, { component: PageComponent; isIndex: boolean }>;
  specialPages: Record<string, PageComponent>;
}

export function parseLocation<
  RouteNames extends string = RegisteredRouteNames,
  RouteParams extends Record<RouteNames, any> = RegisteredRouteParams,
>(location: string): Route<RouteNames, RouteParams> {
  const search = new URLSearchParams(location);
  let name = search.get('page') as RouteNames;
  if (name === '/index') {
    name = '/' as RouteNames;
  }

  const params = {} as RouteParams[RouteNames];
  search.forEach((value, key) => {
    if (key === 'page') return;

    // 1. 配列形式のパラメータ (e.g. ?tags=a&tags=b)
    const allValues = search.getAll(key);
    if (allValues.length > 1) {
      (params as any)[key] = allValues;
      return;
    }

    // 2. JSON オブジェクト形式のパラメータ
    // (getAll 済みなので value は単一)
    if (value.startsWith('{') && value.endsWith('}')) {
      try {
        (params as any)[key] = JSON.parse(value);
        return;
      } catch {
        // JSON パース失敗時は、通常の文字列としてフォールバック
      }
    }

    // 3. 通常の文字列パラメータ
    (params as any)[key] = value;
  });

  return { name, params };
}

export function serializeParams(params: Record<string, any>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        search.append(key, String(v));
      }
    } else if (typeof value === 'object' && value !== null) {
      search.set(key, JSON.stringify(value));
    } else {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export function createRouter<
  RouteNames extends string,
  RouteParams extends Record<RouteNames, any> = RegisteredRouteParams,
  DefaultRouteName extends RouteNames = RouteNames,
  PageComponent = unknown,
>(
  pages: Record<RouteNames, { component: PageComponent; isIndex: boolean }>,
  options?: {
    specialPages?: Record<string, PageComponent>;
    defaultRouteName?: DefaultRouteName;
  },
): Router<RouteNames, RouteParams, PageComponent> {
  const adapter = getAdapter();
  const listeners: Set<Listener<RouteNames, RouteParams>> = new Set();
  const specialPages = options?.specialPages ?? {};
  let ready = false;

  let currentRoute: Route<RouteNames, RouteParams> = {
    name: options?.defaultRouteName ?? ('/' as RouteNames),
    params: {} as any,
  };

  function notify() {
    for (const listener of listeners) {
      listener(currentRoute);
    }
  }

  function resolveRoute(location: string): Route<RouteNames, RouteParams> {
    const route = parseLocation<RouteNames, RouteParams>(location);
    if (route.name) {
      if (!pages[route.name]) {
        route.name = '_404' as RouteNames;
      }
    } else if (options?.defaultRouteName) {
      route.name = options.defaultRouteName;
    } else {
      route.name = '/' as RouteNames;
    }
    return route;
  }

  adapter.getLocation().then((location) => {
    const parsed = parseLocation<RouteNames, RouteParams>(location);

    // パース結果が空(page指定なし)かつデフォルトがある場合
    if (!parsed.name && options?.defaultRouteName) {
      currentRoute = {
        name: options.defaultRouteName,
        params: {} as any,
      };
    } else {
      currentRoute = parsed;
    }

    ready = true;
    notify(); // 初期化完了を通知
  });

  adapter.onChange((location) => {
    if (!ready) return; // ignore changes before initialization
    const nextRoute = resolveRoute(location);

    // Note: Handling browser back/forward with guards is complex.
    // For now, we just notify listeners. In a full implementation,
    // we might need to revert the URL if a guard fails.
    // But since popstate happens *after* the URL changes, reverting is tricky.
    // We will implement guard checks for `navigate` first.
    // If we want to support guards on popstate, we'd need to run them here
    // and if rejected, push the previous URL back.

    currentRoute = nextRoute;
    notify();
  });

  const guards: NavigationGuard<RouteNames, RouteParams>[] = [];

  function internalNavigate(
    name: RouteNames,
    params?: any,
    options?: { replace?: boolean },
  ) {
    const nextParams = (params || {}) as RouteParams[RouteNames];
    const nextRoute: Route<RouteNames, RouteParams> = {
      name,
      params: nextParams,
    };

    const runGuards = (index: number) => {
      if (index >= guards.length) {
        // All guards passed
        finalizeNavigation();
        return;
      }

      const guard = guards[index];
      guard(nextRoute, currentRoute, (nextState) => {
        if (nextState === false) {
          // Navigation cancelled
          return;
        }
        if (typeof nextState === 'string') {
          // Redirect
          // nextState is route name, but we need to parse if it has params?
          // The signature of next() is (to?: string | false).
          // If string, it's usually a path or a route name.
          // Given our router is name-based mostly but supports paths in parseLocation,
          // let's assume it's a route name for now or a full path?
          // If it's a full path (e.g. /login?foo=bar), we should probably parse it.
          // But internalNavigate expects (name, params).

          // If the user passes a string, we can try to parse it as a location string if it starts with ? or has query params.
          // Or if it matches a route name.

          // For simplicity in this iteration: assume it's a route name without params,
          // OR we should expose a way to navigate by path.
          // Let's assume it's a route name for now.
          internalNavigate(nextState as RouteNames);
          return;
        }
        // Continue to next guard
        runGuards(index + 1);
      });
    };

    runGuards(0);

    function finalizeNavigation() {
      const query = nextParams ? serializeParams(nextParams as any) : '';
      const url = query ? `?page=${name}&${query}` : `?page=${name}`;
      if (options?.replace) {
        adapter.replace(url);
      } else {
        adapter.push(url);
      }
      currentRoute = nextRoute;
      notify();
    }
  }

  return {
    pages,
    specialPages,
    isReady: () => ready,
    navigate: <N extends RouteNames>(
      name: N,
      ...args: [keyof RouteParams[N]] extends [never]
        ? [
            params?: RouteParams[N] | undefined | null,
            options?: { replace?: boolean },
          ]
        : [params: RouteParams[N], options?: { replace?: boolean }]
    ) => {
      const [params, options] = args;
      internalNavigate(name, params, options);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      // take current value to listener immediately if initialized
      if (ready) {
        listener(currentRoute);
      }
      return () => {
        listeners.delete(listener);
      };
    },
    getCurrentRoute: () => currentRoute,
    beforeEach: (guard) => {
      guards.push(guard);
      return () => {
        const index = guards.indexOf(guard);
        if (index > -1) {
          guards.splice(index, 1);
        }
      };
    },
  };
}

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

export interface Router<
  RouteNames extends string = RegisteredRouteNames,
  RouteParams extends Record<RouteNames, any> = RegisteredRouteParams,
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
  pages: Record<RouteNames, React.ComponentType<any>>;
}

function parseLocation<
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
>(
  pages: Record<RouteNames, React.ComponentType<any>>,
  options?: {
    defaultRouteName?: DefaultRouteName;
  },
): Router<RouteNames, RouteParams> {
  const adapter = getAdapter();
  const listeners: Set<Listener<RouteNames, RouteParams>> = new Set();

  const initialRoute = parseLocation<RouteNames, RouteParams>(
    adapter.getLocation(),
  );
  if (!initialRoute.name) {
    initialRoute.name = options?.defaultRouteName ?? ('/' as RouteNames);
  }

  let currentRoute = initialRoute;

  adapter.onChange((location) => {
    currentRoute = parseLocation(location);
    notify();
  });

  function notify() {
    for (const listener of listeners) {
      listener(currentRoute);
    }
  }

  return {
    pages,
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
      const query = params ? serializeParams(params as any) : '';
      const url = query ? `?page=${name}&${query}` : `?page=${name}`;
      if (options?.replace) {
        adapter.replace(url);
      } else {
        adapter.push(url);
      }
      currentRoute = { name, params: (params || {}) as RouteParams[N] };
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getCurrentRoute: () => currentRoute,
  };
}

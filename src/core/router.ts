import { getAdapter } from '../env';

type Listener<
  RouteNames extends string,
  RouteParams extends Record<RouteNames, any>,
> = (route: Route<RouteNames, RouteParams>) => void;

export interface Route<
  RouteNames extends string,
  RouteParams extends Record<RouteNames, any>,
> {
  name: RouteNames;
  params: RouteParams[RouteNames];
}

export interface Router<
  RouteNames extends string,
  RouteParams extends Record<RouteNames, any>,
> {
  navigate: <N extends RouteNames>(
    name: N,
    params: RouteParams[N],
    options?: { replace?: boolean },
  ) => void;
  subscribe: (listener: Listener<RouteNames, RouteParams>) => () => void;
  getCurrentRoute: () => Route<RouteNames, RouteParams>;
  pages: Record<RouteNames, React.FC<any>>;
}

function parseLocation<
  RouteNames extends string,
  RouteParams extends Record<RouteNames, any>,
>(location: string): Route<RouteNames, RouteParams> {
  const search = new URLSearchParams(location);
  let name = search.get('page') as RouteNames;
  if (name === 'index') {
    name = '' as RouteNames;
  }

  const params = {} as RouteParams[RouteNames];
  search.forEach((value, key) => {
    if (key === 'page') return;
    // ネストされたオブジェクトは JSON としてパース
    if (value.startsWith('{') && value.endsWith('}')) {
      try {
        (params as any)[key] = JSON.parse(value);
        return;
      } catch (e) {
        // JSON パース失敗時は通常の文字列として扱う
      }
    }
    // 配列形式のパラメータ（同じキーが複数ある場合）
    if (search.getAll(key).length > 1) {
      (params as any)[key] = search.getAll(key);
    } else {
      (params as any)[key] = value;
    }
  });

  return { name, params };
}

export function serializeParams(params: Record<string, any>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
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
  RouteParams extends Record<RouteNames, any>,
>(
  pages: Record<RouteNames, React.FC<any>>,
  options?: {
    defaultRouteName?: RouteNames;
  },
): Router<RouteNames, RouteParams> {
  const adapter = getAdapter();
  const listeners: Set<Listener<RouteNames, RouteParams>> = new Set();

  const initialRoute = parseLocation<RouteNames, RouteParams>(
    adapter.getLocation(),
  );
  if (!initialRoute.name && options?.defaultRouteName !== undefined) {
    initialRoute.name = options.defaultRouteName;
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
    navigate: (name, params, options) => {
      const query = params ? serializeParams(params as any) : '';
      const url = query ? `?page=${name}&${query}` : `?page=${name}`;
      if (options?.replace) {
        adapter.replace(url);
      } else {
        adapter.push(url);
      }
      currentRoute = { name, params };
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

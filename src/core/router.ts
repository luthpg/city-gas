import { type ZodError, type ZodType, z } from 'zod';
import { getAdapter } from '@/env';
import type { Register } from '@/index';

// --- Types ---

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

export interface DynamicRoute {
  name: string;
  pattern: RegExp;
  paramNames: string[];
}

/**
 * Generatorが出力するページ情報の型定義
 * schemaプロパティを受け取れるように拡張
 */
export interface PageInfo<PageComponent> {
  component: PageComponent;
  isIndex: boolean;
  schema?: ZodType;
}

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
  pages: Record<RouteNames, PageInfo<PageComponent>>;
  specialPages: Record<string, PageComponent>;
  dynamicRoutes: DynamicRoute[];
}

// --- Utils ---

export function parseLocation<
  RouteNames extends string = RegisteredRouteNames,
  RouteParams extends Record<RouteNames, any> = RegisteredRouteParams,
>(location: string): { name: string; params: any } {
  const search = new URLSearchParams(location);
  let name = search.get('page') as string;
  if (name === '/index') {
    name = '/';
  }

  const params = {} as RouteParams[RouteNames];
  search.forEach((value, key) => {
    if (key === 'page') return;

    // 1. 配列形式 (e.g. ?tags=a&tags=b)
    const allValues = search.getAll(key);
    if (allValues.length > 1) {
      params[key] = allValues;
      return;
    }

    // 2. JSON オブジェクト形式
    if (value.startsWith('{') && value.endsWith('}')) {
      try {
        params[key] = JSON.parse(value);
        return;
      } catch {
        // Fallback
      }
    }

    // 3. 文字列
    params[key] = value;
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

// --- Core Logic ---

export function createRouter<
  RouteNames extends string,
  RouteParams extends Record<RouteNames, any> = RegisteredRouteParams,
  DefaultRouteName extends RouteNames = RouteNames,
  PageComponent = unknown,
>(
  pages: Record<RouteNames, PageInfo<PageComponent>>,
  options?: {
    specialPages?: Record<string, PageComponent>;
    defaultRouteName?: DefaultRouteName;
    dynamicRoutes?: DynamicRoute[];
    /**
     * バリデーションエラー発生時に呼び出されるフック
     * - 文字列(ルート名)を返すと、そのルートへリダイレクトします (paramsは空になります)
     * - { name, params } を返すと、指定したパラメータでリダイレクトします
     * - void (何も返さない) 場合、デフォルトの動作（警告ログ出力 + _404へ遷移）が行われます
     */
    onValidateError?: (
      error: ZodError,
      context: { name: RouteNames; params: RouteParams[RouteNames] },
    ) =>
      | RouteNames
      | { name: RouteNames; params: RouteParams[RouteNames] }
      // biome-ignore lint/suspicious/noConfusingVoidType: use void return
      | void;
  },
): Router<RouteNames, RouteParams, PageComponent> {
  const adapter = getAdapter();
  const listeners: Set<Listener<RouteNames, RouteParams>> = new Set();
  const specialPages = options?.specialPages ?? {};
  const dynamicRoutes = options?.dynamicRoutes ?? [];
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

  /**
   * URL (Location) からルートとパラメータを解決する
   * バリデーションとCoercion (型変換) を行う
   */
  function resolveRoute(location: string): Route<RouteNames, RouteParams> {
    const parsed = parseLocation<RouteNames, RouteParams>(location);
    let { name, params } = parsed;

    // 1. ルート名の解決 (静的 -> 動的 -> 404)
    if (name && pages[name as RouteNames]) {
      // Static match
    } else if (name) {
      // Dynamic match
      let matched = false;
      for (const dynamic of dynamicRoutes) {
        const match = name.match(dynamic.pattern);
        if (match) {
          name = dynamic.name;
          matched = true;
          dynamic.paramNames.forEach((paramName, index) => {
            params[paramName] = match[index + 1];
          });
          break;
        }
      }
      if (!matched) {
        name = '_404';
      }
    } else if (options?.defaultRouteName) {
      name = options.defaultRouteName;
    } else {
      name = '/';
    }

    // 2. スキーマバリデーション & Coercion
    const pageInfo = pages[name as RouteNames];
    if (pageInfo?.schema) {
      // paramsにはパスパラメータ(string)とクエリパラメータ(string|array|json)が混在している
      // Zodのcoerce機能により、数字などはここで適切な型に変換される
      const result = pageInfo.schema.safeParse(params);
      if (result.success) {
        // 成功したら整形済みのデータ(余計なキーの削除含む)を採用
        params = result.data;
      } else {
        let handled = false;

        if (options?.onValidateError) {
          const fallback = options.onValidateError(result.error, {
            name: name as RouteNames,
            params,
          });

          if (typeof fallback === 'string') {
            // ルート名のみ返された場合: 安全のため params を空にしてリダイレクト
            name = fallback;
            params = {};
            handled = true;
          } else if (typeof fallback === 'object' && fallback !== null) {
            // オブジェクトが返された場合: name と params を指定してリダイレクト
            name = fallback.name;
            params = fallback.params;
            handled = true;
          }
        }

        if (!handled) {
          // ハンドラが未定義、または void を返した場合はデフォルト動作
          console.warn(
            `[city-gas] Validation failed for route "%s". Redirecting to 404.`,
            name,
            result.error,
          );
          name = '_404';
          params = {};
        }
      }
    }

    return {
      name: name as RouteNames,
      params: params as RouteParams[RouteNames],
    };
  }

  // 初期ロード時の処理
  adapter.getLocation().then((location) => {
    const nextRoute = resolveRoute(location);
    currentRoute = nextRoute;
    ready = true;
    notify();
  });

  // ブラウザバック/履歴変更時の処理
  adapter.onChange((location) => {
    if (!ready) return;
    const nextRoute = resolveRoute(location);
    currentRoute = nextRoute;
    notify();
  });

  const guards: NavigationGuard<RouteNames, RouteParams>[] = [];

  /**
   * プログラマティックなナビゲーション処理
   */
  function internalNavigate(
    name: RouteNames,
    params?: any,
    options?: { replace?: boolean },
  ) {
    let nextParams = (params || {}) as RouteParams[RouteNames];

    // スキーマバリデーション (Code -> State)
    const pageInfo = pages[name];
    if (pageInfo?.schema) {
      const result = pageInfo.schema.safeParse(nextParams);
      if (result.success) {
        nextParams = result.data as RouteParams[RouteNames];
      } else {
        // 開発時の実装ミスを防ぐため、navigate時のエラーは例外を投げる
        throw new Error(
          `[city-gas] Navigation aborted: Invalid params for "${name}": ${JSON.stringify(
            z.formatError(result.error),
          )}`,
        );
      }
    }

    const nextRoute: Route<RouteNames, RouteParams> = {
      name,
      params: nextParams,
    };

    // ナビゲーションガードの実行
    const runGuards = (index: number) => {
      if (index >= guards.length) {
        finalizeNavigation();
        return;
      }

      const guard = guards[index];
      guard(nextRoute, currentRoute, (nextState) => {
        if (nextState === false) return;
        if (typeof nextState === 'string') {
          // リダイレクト (引数なしで遷移とみなす)
          internalNavigate(nextState as RouteNames);
          return;
        }
        runGuards(index + 1);
      });
    };

    runGuards(0);

    function finalizeNavigation() {
      let pagePath = name as string;
      const queryParams = { ...nextParams };

      // パスパラメータの置換
      if (pagePath.includes('[')) {
        pagePath = pagePath.replace(/\[([^\][]+)\]/g, (_, paramName) => {
          if (paramName in queryParams) {
            const value = queryParams[paramName];
            // URLパスに使ったパラメータはクエリ文字列から除外する
            delete queryParams[paramName];
            return encodeURIComponent(String(value));
          }
          return `[${paramName}]`;
        });
      }

      const query = serializeParams(queryParams);
      const url = query ? `?page=${pagePath}&${query}` : `?page=${pagePath}`;

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
    dynamicRoutes,
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

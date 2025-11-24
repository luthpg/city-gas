import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod'; // Zodをインポート
import type { DynamicRoute, Router } from '@/core/router';
import { createRouter, serializeParams } from '@/core/router';

// Mock the entire module
const mockAdapter = {
  getLocation: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  onChange: vi.fn(),
};
vi.mock('@/env', () => ({
  getAdapter: () => mockAdapter,
  setAdapter: vi.fn(),
}));

type AppRouteNames =
  | '/'
  | '/about'
  | '/users/show'
  | '/users/[userId]'
  | '/items/[itemId]/edit';

interface AppRouteParams {
  '/': {};
  '/about': {};
  '/users/show': { userId: string; filter?: { type: string } };
  '/users/[userId]': { userId: string; extra?: string };
  '/items/[itemId]/edit': { itemId: string; count?: number }; // countは数値
}

const dynamicRoutes: DynamicRoute[] = [
  {
    name: '/users/[userId]',
    pattern: /^\/users\/([^/]+)$/,
    paramNames: ['userId'],
  },
  {
    name: '/items/[itemId]/edit',
    pattern: /^\/items\/([^/]+)\/edit$/,
    paramNames: ['itemId'],
  },
];

describe('Core Router', () => {
  let router: Router<AppRouteNames, AppRouteParams>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAdapter.getLocation.mockResolvedValue('?page=');

    // ルーターの初期化（schema定義を追加）
    router = createRouter<AppRouteNames, AppRouteParams>(
      {
        '/': {
          component: null,
          isIndex: true,
          schema: z.object({}),
        },
        '/about': {
          component: null,
          isIndex: false,
          schema: z.object({}),
        },
        '/users/show': {
          component: null,
          isIndex: false,
          schema: z.object({
            userId: z.string(),
            filter: z.object({ type: z.string() }).optional(),
          }),
        },
        '/users/[userId]': {
          component: null,
          isIndex: false,
          schema: z.object({
            userId: z.string(),
            extra: z.string().optional(),
          }),
        },
        '/items/[itemId]/edit': {
          component: null,
          isIndex: false,
          schema: z.object({
            itemId: z.string(),
            // URLからの文字列を数値に変換できるかテストするため coerce を使用
            count: z.coerce.number().optional(),
          }),
        },
      },
      {
        defaultRouteName: '/',
        dynamicRoutes: dynamicRoutes,
      },
    );

    await new Promise(process.nextTick);
  });

  it('should initialize with the default route', () => {
    const currentRoute = router.getCurrentRoute();
    expect(currentRoute.name).toBe('/');
    expect(currentRoute.params).toEqual({});
  });

  it('should navigate to a new route and update the URL', () => {
    router.navigate('/about', {});
    const currentRoute = router.getCurrentRoute();
    expect(currentRoute.name).toBe('/about');
    expect(mockAdapter.push).toHaveBeenCalledWith('?page=/about');
  });

  it('should navigate with params and serialize them correctly', () => {
    router.navigate('/users/show', { userId: '42' });
    const currentRoute = router.getCurrentRoute();
    expect(currentRoute.name).toBe('/users/show');
    expect(currentRoute.params).toEqual({ userId: '42' });
    expect(mockAdapter.push).toHaveBeenCalledWith(
      '?page=/users/show&userId=42',
    );
  });

  it('should handle complex nested params during navigation', () => {
    const params = { userId: '123', filter: { type: 'active' } };
    router.navigate('/users/show', params);
    const serialized = serializeParams(params);
    expect(mockAdapter.push).toHaveBeenCalledWith(
      `?page=/users/show&${serialized}`,
    );
    expect(serialized).toContain('filter=%7B%22type%22%3A%22active%22%7D');
  });

  it('should subscribe to route changes and notify listeners', () => {
    const listener = vi.fn();
    const unsubscribe = router.subscribe(listener);

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/about');

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '/about' }),
    );

    unsubscribe();
    onChangeCallback('?page=/');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should fall back to _404 if a non-existent page is requested', () => {
    const listener = vi.fn();
    router.subscribe(listener);

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/not-found');

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '_404' }),
    );
  });

  // --- Dynamic Routes Tests ---

  it('should navigate to a dynamic route and substitute params in path', () => {
    router.navigate('/users/[userId]', { userId: '123', extra: 'foo' });

    // Expect path to be substituted: /users/123
    // Expect userId to be removed from query, extra to remain
    expect(mockAdapter.push).toHaveBeenCalledWith('?page=/users/123&extra=foo');

    const currentRoute = router.getCurrentRoute();
    expect(currentRoute.name).toBe('/users/[userId]');
    expect(currentRoute.params).toEqual({ userId: '123', extra: 'foo' });
  });

  it('should resolve a dynamic route from URL', () => {
    const listener = vi.fn();
    router.subscribe(listener);

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    // Simulate arriving at /users/456
    onChangeCallback('?page=/users/456&extra=bar');

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: '/users/[userId]',
        params: { userId: '456', extra: 'bar' },
      }),
    );
  });

  it('should prefer static routes over dynamic routes', () => {
    // /users/show exists as a static route
    const listener = vi.fn();
    router.subscribe(listener);

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    // Simulate arriving at /users/show (which also matches /users/[userId] regex)
    onChangeCallback('?page=/users/show&userId=123');

    // Should resolve to static route
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '/users/show' }),
    );
  });

  // --- Zod Runtime Validation Tests (追加部分) ---

  it('should validate and coerce params from URL (runtime)', () => {
    const listener = vi.fn();
    router.subscribe(listener);

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    // URLクエリパラメータ "count" は文字列 "10" だが、schemaに z.coerce.number() があるため数値に変換される
    onChangeCallback('?page=/items/999/edit&count=10');

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: '/items/[itemId]/edit',
        params: { itemId: '999', count: 10 }, // 数値の 10 になっていること
      }),
    );
  });

  it('should fallback to 404 when URL params fail validation', () => {
    const listener = vi.fn();
    router.subscribe(listener);

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    // "count" は数値を期待しているが、数値変換できない文字列 "invalid" が来た場合 -> validation error
    onChangeCallback('?page=/items/999/edit&count=invalid-number');

    // _404 にフォールバックすることを確認
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '_404' }),
    );
  });

  it('should throw error when navigating with invalid params (developer error)', () => {
    expect(() => {
      // @ts-expect-error Testing runtime error for invalid type
      // countに文字列を渡す（coerceは効くが、もし純粋なnumberのみ許可するschemaならエラーになる）
      // ここでは z.coerce.number() なので文字列の "123" は通るが、 "NaN" は通らない
      router.navigate('/items/[itemId]/edit', { itemId: '123', count: 'NaN' });
    }).toThrowError(/\[city-gas\] Navigation aborted/);
  });

  it('should allow navigation with valid params (stripping unknown if Zod strict, usually keeping if not)', () => {
    // Zodのデフォルト（strip）により、定義されていないパラメータは除去される挙動を確認
    router.navigate('/users/show', {
      userId: '42',
      // @ts-expect-error Unknown param
      unknownParam: 'should-be-stripped',
    });

    const currentRoute = router.getCurrentRoute();
    // unknownParam は params オブジェクトに含まれていないはず
    expect(currentRoute.params).toEqual({ userId: '42' });
  });
});

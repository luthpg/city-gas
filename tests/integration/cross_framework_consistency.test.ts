import { describe, expect, it, vi } from 'vitest';
import type { DynamicRoute } from '@/core/router';
import { createRouter } from '@/core/router';

// Mock environment adapter
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

// Mock components (framework-agnostic)
const MockComponent = () => null;

describe('Integration - Cross-Framework Consistency', () => {
  const createTestRouter = async () => {
    vi.clearAllMocks();
    mockAdapter.getLocation.mockResolvedValue('?page=/');

    const pages = {
      '/': { component: MockComponent, isIndex: true },
      '/about': { component: MockComponent, isIndex: false },
      '/users/[userId]': { component: MockComponent, isIndex: false },
      '/posts/[postId]': { component: MockComponent, isIndex: false },
    };

    const specialPages = {
      _root: MockComponent,
      'users/_layout': MockComponent,
      _404: MockComponent,
    };

    const dynamicRoutes: DynamicRoute[] = [
      {
        name: '/users/[userId]',
        pattern: /^\/users\/([^/]+)$/,
        paramNames: ['userId'],
      },
      {
        name: '/posts/[postId]',
        pattern: /^\/posts\/([^/]+)$/,
        paramNames: ['postId'],
      },
    ];

    const router = createRouter(pages, {
      specialPages,
      dynamicRoutes,
      defaultRouteName: '/',
    });

    // Wait for router ready
    await vi.waitFor(() => expect(router.isReady()).toBe(true));

    return router;
  };

  it('should resolve static routes consistently', async () => {
    vi.clearAllMocks();
    mockAdapter.getLocation.mockResolvedValue('?page=/');

    const router = createRouter(
      {
        '/': { component: MockComponent, isIndex: true },
        '/about': { component: MockComponent, isIndex: false },
      },
      { defaultRouteName: '/' },
    );

    await vi.waitFor(() => expect(router.isReady()).toBe(true));

    // Initial route
    expect(router.getCurrentRoute().name).toBe('/');

    // Navigate to about
    router.navigate('/about', {});
    expect(mockAdapter.push).toHaveBeenCalledWith(
      expect.stringContaining('page=/about'),
    );
  });

  it('should resolve dynamic routes consistently', async () => {
    const router = await createTestRouter();

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];

    // Test dynamic route resolution
    onChangeCallback('?page=/users/123');
    await vi.waitFor(() => {
      const route = router.getCurrentRoute();
      expect(route.name).toBe('/users/[userId]');
      expect(route.params).toEqual({ userId: '123' });
    });

    // Test another dynamic route
    onChangeCallback('?page=/posts/456');
    await vi.waitFor(() => {
      const route = router.getCurrentRoute();
      expect(route.name).toBe('/posts/[postId]');
      expect(route.params).toEqual({ postId: '456' });
    });
  });

  it('should handle 404 fallback consistently', async () => {
    const router = await createTestRouter();

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];

    // Navigate to non-existent route
    onChangeCallback('?page=/non-existent');
    await vi.waitFor(() => {
      const route = router.getCurrentRoute();
      expect(route.name).toBe('_404');
    });
  });

  it('should serialize params consistently', async () => {
    const router = await createTestRouter();

    // Navigate with params
    router.navigate('/users/[userId]', { userId: '42', tab: 'profile' });

    expect(mockAdapter.push).toHaveBeenCalledWith(
      expect.stringMatching(/page=\/users\/42/),
    );
    expect(mockAdapter.push).toHaveBeenCalledWith(
      expect.stringMatching(/tab=profile/),
    );
  });

  it('should handle complex params consistently', async () => {
    vi.clearAllMocks();
    mockAdapter.getLocation.mockResolvedValue('?page=/');

    const router = await createTestRouter();

    // Navigate with nested object params
    router.navigate('/about', {
      filter: { type: 'active', category: 'test' },
    });

    const callArg = mockAdapter.push.mock.calls[0][0];
    expect(callArg).toContain('page=/about');
    expect(callArg).toContain('filter=');
    // Verify JSON encoding
    expect(callArg).toMatch(/%7B.*%7D/); // URL-encoded JSON
  });

  it('should maintain route state consistently', async () => {
    const router = await createTestRouter();

    // Initial state
    const initialRoute = router.getCurrentRoute();
    expect(initialRoute.name).toBe('/');

    // After navigation
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/about');

    await vi.waitFor(() => {
      const currentRoute = router.getCurrentRoute();
      expect(currentRoute.name).toBe('/about');
      expect(currentRoute.params).toEqual({});
    });
  });

  it('should handle subscription/unsubscription consistently', async () => {
    const router = await createTestRouter();

    const listener = vi.fn();
    const unsubscribe = router.subscribe(listener);

    // Listener should be called immediately with current route
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ name: '/' }),
    );

    listener.mockClear();

    // Navigate
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/about');

    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ name: '/about' }),
      );
    });

    listener.mockClear();

    // Unsubscribe
    unsubscribe();

    // Navigate again
    onChangeCallback('?page=/users/123');

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Listener should not be called after unsubscribe
    expect(listener).not.toHaveBeenCalled();
  });

  it('should handle default route consistently when route not found', async () => {
    vi.clearAllMocks();
    mockAdapter.getLocation.mockResolvedValue('?page=/');

    const router = createRouter(
      {
        '/': { component: MockComponent, isIndex: true },
        '/about': { component: MockComponent, isIndex: false },
        _404: { component: MockComponent, isIndex: false },
      },
      {
        defaultRouteName: '/',
      },
    );

    await vi.waitFor(() => expect(router.isReady()).toBe(true));

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];

    // Navigate to non-existent route
    onChangeCallback('?page=/does-not-exist');

    await vi.waitFor(() => {
      const route = router.getCurrentRoute();
      expect(route.name).toBe('_404');
    });
  });

  it('should handle URL parameter parsing consistently', async () => {
    const router = await createTestRouter();

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];

    // Test with multiple query params
    onChangeCallback(
      '?page=/about&param1=value1&param2=value2&param3=%7B%22nested%22%3A%22object%22%7D',
    );

    await vi.waitFor(() => {
      const route = router.getCurrentRoute();
      expect(route.name).toBe('/about');
      expect(route.params.param1).toBe('value1');
      expect(route.params.param2).toBe('value2');
      expect(route.params.param3).toEqual({ nested: 'object' });
    });
  });

  it('should handle empty params consistently', async () => {
    const router = await createTestRouter();

    // Navigate with no params
    router.navigate('/about', {});

    expect(mockAdapter.push).toHaveBeenCalledWith('?page=/about');
  });
});

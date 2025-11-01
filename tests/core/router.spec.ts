import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '@/core/router';
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
  setAdapter: vi.fn(), // It's mocked, but we won't use it
}));

type AppRouteNames = '/' | '/about' | '/users/show';
interface AppRouteParams {
  '/': {};
  '/about': {};
  '/users/show': { userId: string; filter?: { type: string } };
}

describe('Core Router', () => {
  let router: Router<AppRouteNames, AppRouteParams>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Mock implementation of getLocation to immediately call the callback
    mockAdapter.getLocation.mockImplementation((cb) => cb('?page='));

    router = createRouter<AppRouteNames, AppRouteParams>(
      {
        '/': () => null,
        '/about': () => null,
        '/users/show': () => null,
      },
      { defaultRouteName: '/' },
    );
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
    expect(serialized).toContain('filter=%7B%22type%22%3A%22active%22%7D'); // JSON.stringify
  });

  it('should subscribe to route changes and notify listeners', () => {
    const listener = vi.fn();
    const unsubscribe = router.subscribe(listener);

    // Simulate URL change from adapter
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/about');

    // The listener is called once on subscribe and once on change
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '/about' }),
    );

    unsubscribe();
    onChangeCallback('?page=/');
    expect(listener).toHaveBeenCalledTimes(2); // Should not be called after unsubscribe
  });

  it('should use replace option when navigating', () => {
    router.navigate('/about', {}, { replace: true });
    expect(mockAdapter.replace).toHaveBeenCalledWith('?page=/about');
    expect(mockAdapter.push).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRouter } from '@/core/router';

// Mock adapter
const mockAdapter = {
  getLocation: vi.fn(() => Promise.resolve('?page=/')),
  onChange: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
};

vi.mock('@/env', () => ({
  getAdapter: () => mockAdapter,
}));

describe('Router Navigation Guards', () => {
  type Routes = '/' | '/login' | '/dashboard';
  type Params = {
    '/': {};
    '/login': {};
    '/dashboard': {};
  };

  const pages = {
    '/': { component: 'Home', isIndex: true },
    '/login': { component: 'Login', isIndex: false },
    '/dashboard': { component: 'Dashboard', isIndex: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow navigation when next() is called', () => {
    const router = createRouter<Routes, Params>(pages);

    router.beforeEach((_to, _from, next) => {
      next();
    });

    router.navigate('/dashboard', {});
    expect(mockAdapter.push).toHaveBeenCalledWith('?page=/dashboard');
    expect(router.getCurrentRoute().name).toBe('/dashboard');
  });

  it('should cancel navigation when next(false) is called', () => {
    const router = createRouter<Routes, Params>(pages);

    router.beforeEach((_to, _from, next) => {
      next(false);
    });

    router.navigate('/dashboard', {});
    // Should remain at initial route
    expect(mockAdapter.push).not.toHaveBeenCalledWith('?page=/dashboard');
    expect(router.getCurrentRoute().name).toBe('/');
  });

  it('should redirect when next(path) is called', () => {
    const router = createRouter<Routes, Params>(pages);

    router.beforeEach((to, _from, next) => {
      if (to.name === '/dashboard') {
        next('/login');
      } else {
        next();
      }
    });

    router.navigate('/dashboard', {});

    // Should not go to dashboard
    expect(mockAdapter.push).not.toHaveBeenCalledWith('?page=/dashboard');

    // Should go to login
    expect(mockAdapter.push).toHaveBeenCalledWith('?page=/login');
    expect(router.getCurrentRoute().name).toBe('/login');
  });

  it('should execute multiple guards in order', () => {
    const router = createRouter<Routes, Params>(pages);
    const order: string[] = [];

    router.beforeEach((_to, _from, next) => {
      order.push('first');
      next();
    });

    router.beforeEach((_to, _from, next) => {
      order.push('second');
      next();
    });

    router.navigate('/dashboard', {});
    expect(order).toEqual(['first', 'second']);
    expect(router.getCurrentRoute().name).toBe('/dashboard');
  });

  it('should stop at the first guard that cancels', () => {
    const router = createRouter<Routes, Params>(pages);
    const order: string[] = [];

    router.beforeEach((_to, _from, next) => {
      order.push('first');
      next(false);
    });

    router.beforeEach((_to, _from, next) => {
      order.push('second');
      next();
    });

    router.navigate('/dashboard', {});
    expect(order).toEqual(['first']);
    expect(router.getCurrentRoute().name).toBe('/');
  });
});

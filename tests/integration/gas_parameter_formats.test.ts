// GAS Parameter Formats E2E Tests
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '@/core/router';
import { createRouter } from '@/core/router';

// Mock google.script API
const mockGoogleScript = {
  history: {
    push: vi.fn(),
    replace: vi.fn(),
    setChangeHandler: vi.fn(),
  },
  url: {
    getLocation: vi.fn(),
  },
};

vi.stubGlobal('google', { script: mockGoogleScript });

describe('GAS E2E - Parameter Formats', () => {
  let router: Router<string, any>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const pages = {
      '/': { component: () => null, isIndex: true },
      '/search': { component: () => null, isIndex: false },
      '/products': { component: () => null, isIndex: false },
      _404: { component: () => null, isIndex: false },
    };
    router = createRouter(pages, { defaultRouteName: '/' });
  });

  describe('parameter format (single values)', () => {
    it('should parse single parameter values', async () => {
      mockGoogleScript.url.getLocation.mockImplementation((callback) => {
        callback({
          parameter: {
            page: '/search',
            query: 'test',
            category: 'books',
          },
        });
      });

      // Re-create router to trigger getLocation
      router = createRouter(
        {
          '/search': { component: () => null, isIndex: false },
          _404: { component: () => null, isIndex: false },
        },
        { defaultRouteName: '_404' },
      );

      await vi.waitFor(() => expect(router.isReady()).toBe(true));

      const route = router.getCurrentRoute();
      expect(route.name).toBe('/search');
      expect(route.params).toEqual({ query: 'test', category: 'books' });
    });

    it('should handle empty parameter object', async () => {
      mockGoogleScript.url.getLocation.mockImplementation((callback) => {
        callback({
          parameter: { page: '/' },
        });
      });

      router = createRouter(
        {
          '/': { component: () => null, isIndex: true },
        },
        {},
      );

      await vi.waitFor(() => expect(router.isReady()).toBe(true));

      const route = router.getCurrentRoute();
      expect(route.name).toBe('/');
      expect(route.params).toEqual({});
    });
  });

  describe('parameters format (array values)', () => {
    it('should parse parameters with array values', async () => {
      mockGoogleScript.url.getLocation.mockImplementation((callback) => {
        callback({
          parameters: {
            page: ['/products'],
            tags: ['electronics', 'featured', 'sale'],
            sortBy: ['price'],
          },
        });
      });

      router = createRouter(
        {
          '/products': { component: () => null, isIndex: false },
          _404: { component: () => null, isIndex: false },
        },
        { defaultRouteName: '_404' },
      );

      await vi.waitFor(() => expect(router.isReady()).toBe(true));

      const route = router.getCurrentRoute();
      expect(route.name).toBe('/products');
      expect(route.params).toEqual({
        tags: ['electronics', 'featured', 'sale'],
        sortBy: 'price', // single-item arrays become scalar
      });
    });

    it('should handle single-element arrays in parameters', async () => {
      mockGoogleScript.url.getLocation.mockImplementation((callback) => {
        callback({
          parameters: {
            page: ['/search'],
            query: ['typescript'],
          },
        });
      });

      router = createRouter(
        {
          '/search': { component: () => null, isIndex: false },
        },
        {},
      );

      await vi.waitFor(() => expect(router.isReady()).toBe(true));

      const route = router.getCurrentRoute();
      expect(route.params).toEqual({ query: 'typescript' });
    });

    it('should preserve multi-element arrays', async () => {
      mockGoogleScript.url.getLocation.mockImplementation((callback) => {
        callback({
          parameters: {
            page: ['/products'],
            colors: ['red', 'blue', 'green'],
          },
        });
      });

      router = createRouter(
        {
          '/products': { component: () => null, isIndex: false },
        },
        {},
      );

      await vi.waitFor(() => expect(router.isReady()).toBe(true));

      const route = router.getCurrentRoute();
      expect(route.params.colors).toEqual(['red', 'blue', 'green']);
      expect(Array.isArray(route.params.colors)).toBe(true);
    });
  });

  describe('priority when both formats exist', () => {
    it('should prioritize parameters over parameter', async () => {
      mockGoogleScript.url.getLocation.mockImplementation((callback) => {
        callback({
          parameter: {
            page: '/search',
            query: 'old-value',
            legacyParam: 'legacy',
          },
          parameters: {
            page: ['/search'],
            query: ['new-value'],
          },
        });
      });

      router = createRouter(
        {
          '/search': { component: () => null, isIndex: false },
        },
        {},
      );

      await vi.waitFor(() => expect(router.isReady()).toBe(true));

      const route = router.getCurrentRoute();
      expect(route.params.query).toBe('new-value');
      expect(route.params).not.toHaveProperty('legacyParam');
    });

    it('should fallback to parameter when parameters is missing', async () => {
      mockGoogleScript.url.getLocation.mockImplementation((callback) => {
        callback({
          parameter: {
            page: '/search',
            query: 'fallback-value',
          },
          // parameters undefined
        });
      });

      router = createRouter(
        {
          '/search': { component: () => null, isIndex: false },
        },
        {},
      );

      await vi.waitFor(() => expect(router.isReady()).toBe(true));

      const route = router.getCurrentRoute();
      expect(route.params.query).toBe('fallback-value');
    });
  });

  describe('URL encoding in parameters', () => {
    it('should handle URL-encoded values in parameter', async () => {
      mockGoogleScript.url.getLocation.mockImplementation((callback) => {
        callback({
          parameter: {
            page: '/search',
            query: 'hello%20world',
          },
        });
      });

      router = createRouter(
        {
          '/search': { component: () => null, isIndex: false },
        },
        {},
      );

      await vi.waitFor(() => expect(router.isReady()).toBe(true));

      const route = router.getCurrentRoute();
      expect(route.params.query).toBeTruthy();
    });

    it('should handle special characters in parameters', async () => {
      mockGoogleScript.url.getLocation.mockImplementation((callback) => {
        callback({
          parameters: {
            page: ['/search'],
            query: ['C++ Programming'],
            tags: ['#javascript', '@typescript'],
          },
        });
      });

      router = createRouter(
        {
          '/search': { component: () => null, isIndex: false },
        },
        {},
      );

      await vi.waitFor(() => expect(router.isReady()).toBe(true));

      const route = router.getCurrentRoute();
      expect(route.params.query).toBe('C++ Programming');
      expect(route.params.tags).toEqual(['#javascript', '@typescript']);
    });
  });

  describe('sending parameters via push/replace', () => {
    it('should send parameters as object to google.script.history.push', async () => {
      await vi.waitFor(() => expect(router.isReady()).toBe(true));
      router.navigate('/search', { query: 'test', filter: 'active' });

      expect(mockGoogleScript.history.push).toHaveBeenCalledWith(
        {},
        { page: '/search', query: 'test', filter: 'active' },
        '',
      );
    });

    it('should send parameters via replace method', async () => {
      await vi.waitFor(() => expect(router.isReady()).toBe(true));
      router.navigate('/search', { query: 'replaced' }, { replace: true });

      expect(mockGoogleScript.history.replace).toHaveBeenCalledWith(
        {},
        { page: '/search', query: 'replaced' },
        '',
      );
      expect(mockGoogleScript.history.push).not.toHaveBeenCalled();
    });
  });
});

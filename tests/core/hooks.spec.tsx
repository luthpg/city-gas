import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it } from 'vitest';
import { useNavigate, useParams, useRoute } from '../../src/core/hooks';
import { RouterProvider } from '../../src/core/provider';
import { createRouter } from '../../src/core/router';

type AppRouteNames = '' | 'about' | 'users';
type AppRouteParams = {
  '': Record<string, never>;
  about: Record<string, never>;
  users: { id: string; show: boolean };
};

describe('hooks', () => {
  const pages = {
    '': () => <div>Home</div>,
    about: () => <div>About</div>,
    users: ({ id, show }: AppRouteParams['users']) => (
      <div>
        User {id}, Show {show ? 'true' : 'false'}
      </div>
    ),
  };

  const setup = () => {
    const router = createRouter<AppRouteNames, AppRouteParams>(pages, {
      defaultRouteName: '',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RouterProvider router={router}>{children}</RouterProvider>
    );

    return { router, wrapper };
  };

  describe('useRoute', () => {
    it('should return the initial route', () => {
      const { wrapper } = setup();
      const { result } = renderHook(() => useRoute(), { wrapper });

      expect(result.current.name).toBe('');
      expect(result.current.params).toEqual({});
    });

    it('should update the route on navigation', () => {
      const { router, wrapper } = setup();
      const { result } = renderHook(() => useRoute(), { wrapper });

      act(() => {
        router.navigate('users', { id: '123', show: true });
      });

      expect(result.current.name).toBe('users');
      expect(result.current.params).toEqual({ id: '123', show: true });
    });
  });

  describe('useParams', () => {
    it('should return the initial empty params', () => {
      const { wrapper } = setup();
      const { result } = renderHook(() => useParams(), { wrapper });

      expect(result.current).toEqual({});
    });

    it('should return updated params on navigation', () => {
      const { router, wrapper } = setup();
      const { result } = renderHook(() => useParams(), { wrapper });

      act(() => {
        router.navigate('users', { id: '456', show: false });
      });

      expect(result.current).toEqual({ id: '456', show: false });
    });
  });

  describe('useNavigate', () => {
    it('should return the navigate function', () => {
      const { router, wrapper } = setup();
      const { result } = renderHook(() => useNavigate(), { wrapper });

      // Check if the returned function is the same as the router's navigate function
      expect(result.current).toBe(router.navigate);
    });
  });
});

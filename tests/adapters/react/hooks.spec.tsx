import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  useNavigate,
  useParams,
  useRoute,
  useRouter,
} from '@/adapters/react/hooks';
import { RouterProvider } from '@/adapters/react/provider';
import type { Route, Router } from '@/core/router';

// Mock data and types
type AppRouteNames = '/' | '/profile';
interface AppRouteParams {
  // biome-ignore lint/complexity/noBannedTypes: this is a mock
  '/': {};
  '/profile': { id: string };
}

// Mock router
const createMockRouter = (
  initialRoute: Route<AppRouteNames, AppRouteParams>,
) => {
  const listeners = new Set<(route: any) => void>();
  let currentRoute = initialRoute;

  const router = {
    navigate: vi.fn((name, params) => {
      currentRoute = { name, params };
      for (const listener of listeners) {
        listener(currentRoute);
      }
    }),
    subscribe: (listener: (route: any) => void) => {
      listeners.add(listener);
      // Immediately call the listener with the current route
      listener(currentRoute);
      return () => listeners.delete(listener);
    },
    getCurrentRoute: () => currentRoute,
  } as unknown as Router<AppRouteNames, AppRouteParams>;

  return { router };
};

describe('React Hooks', () => {
  it('useRouterContext throws an error when used outside of a RouterProvider', () => {
    const TestComponent = () => {
      useRouter();
      return null;
    };
    // Suppress console.error output from React
    const originalError = console.error;
    console.error = vi.fn();
    expect(() => render(<TestComponent />)).toThrow(
      'useRouterContext must be used within a RouterProvider',
    );
    console.error = originalError;
  });

  const TestComponent = ({ onRender }: { onRender: (data: any) => void }) => {
    const route = useRoute<AppRouteNames, AppRouteParams>();
    const params = useParams<AppRouteNames, AppRouteParams>();
    const router = useRouter<AppRouteNames, AppRouteParams>();
    const navigate = useNavigate<AppRouteNames, AppRouteParams>();

    useEffect(() => {
      onRender({ route, params, router, navigate });
    }, [route, params, router, navigate, onRender]);

    return (
      <div>
        <div data-testid="route-name">{route.name}</div>
        <div data-testid="params-id">{(params as any)?.id}</div>
        <button
          type="button"
          onClick={() => navigate('/profile', { id: '123' })}
        >
          Go
        </button>
      </div>
    );
  };

  it('should return the correct initial values', () => {
    const { router } = createMockRouter({ name: '/', params: {} });
    const onRender = vi.fn();

    render(
      <RouterProvider router={router}>
        <TestComponent onRender={onRender} />
      </RouterProvider>,
    );

    expect(screen.getByTestId('route-name').textContent).toBe('/');
    expect(onRender).toHaveBeenCalledWith(
      expect.objectContaining({
        route: { name: '/', params: {} },
        params: {},
        router,
      }),
    );
  });

  it('should update when the route changes', () => {
    const { router } = createMockRouter({ name: '/', params: {} });

    render(
      <RouterProvider router={router}>
        <TestComponent onRender={() => {}} />
      </RouterProvider>,
    );

    act(() => {
      router.navigate('/profile', { id: '456' });
    });

    expect(screen.getByTestId('route-name').textContent).toBe('/profile');
    expect(screen.getByTestId('params-id').textContent).toBe('456');
  });

  it('useNavigate should call the router navigate method', () => {
    const { router } = createMockRouter({ name: '/', params: {} });

    render(
      <RouterProvider router={router}>
        <TestComponent onRender={() => {}} />
      </RouterProvider>,
    );

    act(() => {
      screen.getByRole('button', { name: 'Go' }).click();
    });

    expect(router.navigate).toHaveBeenCalledWith('/profile', { id: '123' });
  });
});

import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavigate, useParams, useRoute } from '@/adapters/react/hooks';
import { RouterProvider } from '@/adapters/react/provider';
import { RouterOutlet } from '@/adapters/react/RouterOutlet';
import type { Router } from '@/core/router';
import { createRouter } from '@/core/router';

// Mock google.script API for GAS environment
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

// Setup global google object
vi.stubGlobal('google', { script: mockGoogleScript });

// Test Components
const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div>
      <h1>Home Page</h1>
      <button type="button" onClick={() => navigate('/about', {})}>
        Go to About
      </button>
    </div>
  );
};

const AboutPage = () => {
  const navigate = useNavigate();
  const route = useRoute();
  return (
    <div>
      <h1>About Page</h1>
      <p>Current Route: {route.name}</p>
      <button type="button" onClick={() => navigate('/', {})}>
        Go to Home
      </button>
    </div>
  );
};

const UserPage = () => {
  const params = useParams('/users/[userId]');
  return (
    <div>
      <h1>User: {params.userId}</h1>
      {params.role && <p>Role: {params.role}</p>}
    </div>
  );
};

const NotFound = () => <div>404 Not Found</div>;

describe('GAS React E2E - Navigation Flow', () => {
  let router: Router<string, any>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock initial location
    mockGoogleScript.url.getLocation.mockImplementation((callback) => {
      callback({ parameter: { page: '/' } });
    });

    const pages = {
      '/': { component: HomePage, isIndex: true },
      '/about': { component: AboutPage, isIndex: false },
      '/users/[userId]': { component: UserPage, isIndex: false },
      _404: { component: NotFound, isIndex: false },
    };

    const dynamicRoutes = [
      {
        name: '/users/[userId]',
        pattern: /^\/users\/([^/]+)$/,
        paramNames: ['userId'],
      },
    ];

    router = createRouter(pages, {
      dynamicRoutes,
      defaultRouteName: '/',
    });

    await waitFor(() => expect(router.isReady()).toBe(true));
  });

  it('should initialize with GAS getLocation', async () => {
    expect(mockGoogleScript.url.getLocation).toHaveBeenCalled();
    expect(router.getCurrentRoute().name).toBe('/');
  });

  it('should navigate using google.script.history.push', async () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    // Navigate to about
    router.navigate('/about', {});

    // Verify google.script.history.push was called
    expect(mockGoogleScript.history.push).toHaveBeenCalledWith(
      {},
      { page: '/about' },
      '',
    );
  });

  it('should handle navigation with parameters in GAS format', async () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    // Navigate with params
    router.navigate('/users/[userId]', { userId: 'alice', role: 'admin' });

    // Verify GAS API call with proper parameter format
    expect(mockGoogleScript.history.push).toHaveBeenCalledWith(
      {},
      { page: '/users/alice', role: 'admin' },
      '',
    );
  });

  it('should handle change events from GAS setChangeHandler', async () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    // Verify setChangeHandler was registered
    expect(mockGoogleScript.history.setChangeHandler).toHaveBeenCalled();

    // Get the change handler
    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];

    // Simulate navigation event from GAS
    await act(async () => {
      changeHandler({
        location: {
          parameter: {
            page: '/about',
          },
        },
      });
    });

    // Verify UI updated
    await waitFor(() => {
      expect(screen.getByText('About Page')).toBeInTheDocument();
      expect(screen.getByText('Current Route: /about')).toBeInTheDocument();
    });
  });

  it('should handle dynamic routes through GAS change handler', async () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];

    // Simulate navigation to dynamic route via GAS
    await act(async () => {
      changeHandler({
        location: {
          parameter: {
            page: '/users/bob',
            role: 'user',
          },
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('User: bob')).toBeInTheDocument();
      expect(screen.getByText('Role: user')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('/users/[userId]');
    expect(route.params).toEqual({ userId: 'bob', role: 'user' });
  });

  it('should use google.script.history.replace for replace navigation', async () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    router.navigate('/about', {}, { replace: true });

    expect(mockGoogleScript.history.replace).toHaveBeenCalledWith(
      {},
      { page: '/about' },
      '',
    );
    expect(mockGoogleScript.history.push).not.toHaveBeenCalled();
  });

  it('should handle hash in GAS navigation', async () => {
    // Note: GAS adapter doesn't support hash in current implementation
    // but this test documents the expected behavior
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    router.navigate('/about', {});

    // Current implementation passes empty hash
    expect(mockGoogleScript.history.push).toHaveBeenCalledWith(
      {},
      { page: '/about' },
      '',
    );
  });

  it('should handle 404 routes in GAS environment', async () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];

    // Simulate navigation to non-existent route
    await act(async () => {
      changeHandler({
        location: {
          parameter: {
            page: '/non-existent',
          },
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('404 Not Found')).toBeInTheDocument();
    });

    expect(router.getCurrentRoute().name).toBe('_404');
  });

  it('should handle back/forward simulation via GAS events', async () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];

    // Navigate to about
    await act(async () => {
      changeHandler({
        location: { parameter: { page: '/about' } },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('About Page')).toBeInTheDocument();
    });

    // Simulate back navigation
    await act(async () => {
      changeHandler({
        location: { parameter: { page: '/' } },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });
});

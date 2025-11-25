import { act, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavigate, useParams, useRoute } from '@/adapters/react/hooks';
import { RouterProvider } from '@/adapters/react/provider';
import { RouterOutlet } from '@/adapters/react/RouterOutlet';
import type { Router } from '@/core/router';
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
  const navigate = useNavigate();
  return (
    <div>
      <h1>User: {params.userId}</h1>
      {params.tab && <p>Tab: {params.tab}</p>}
      <button
        type="button"
        onClick={() =>
          navigate('/users/[userId]', { userId: '999', tab: 'settings' })
        }
      >
        Go to User 999
      </button>
    </div>
  );
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="root-layout">
    <header>Header</header>
    {children}
    <footer>Footer</footer>
  </div>
);

const UsersLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="users-layout">
    <nav>Users Nav</nav>
    {children}
  </div>
);

const NotFound = () => <div>404 Not Found</div>;

describe('React Integration - Navigation Flow', () => {
  let router: Router<string, any>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAdapter.getLocation.mockResolvedValue('?page=/');

    const pages = {
      '/': { component: HomePage, isIndex: true },
      '/about': { component: AboutPage, isIndex: false },
      '/users/[userId]': { component: UserPage, isIndex: false },
    };

    const specialPages = {
      _root: RootLayout,
      'users/_layout': UsersLayout,
      _404: NotFound,
    };

    const dynamicRoutes = [
      {
        name: '/users/[userId]',
        pattern: /^\/users\/([^/]+)$/,
        paramNames: ['userId'],
      },
    ];

    router = createRouter(pages, {
      specialPages,
      dynamicRoutes,
      defaultRouteName: '/',
    });

    // Wait for router to be ready
    await waitFor(() => expect(router.isReady()).toBe(true));
  });

  it('should render initial route with root layout', async () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    expect(screen.getByTestId('root-layout')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should navigate between pages using useNavigate hook', async () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    // Initial page
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    // Navigate to About
    const aboutButton = screen.getByText('Go to About');
    await act(async () => {
      aboutButton.click();
    });

    await waitFor(() => {
      expect(mockAdapter.push).toHaveBeenCalledWith(
        expect.stringContaining('page=/about'),
      );
    });

    // Simulate the route change
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/about');
    });

    await waitFor(() => {
      expect(screen.getByText('About Page')).toBeInTheDocument();
      expect(screen.getByText('Current Route: /about')).toBeInTheDocument();
    });
  });

  it('should navigate to dynamic route and display params', async () => {
    mockAdapter.getLocation.mockResolvedValue('?page=/users/123&tab=profile');

    // Simulate navigation to dynamic route
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/users/123&tab=profile');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('User: 123')).toBeInTheDocument();
      expect(screen.getByText('Tab: profile')).toBeInTheDocument();
    });

    // Check that nested layouts are applied
    expect(screen.getByTestId('root-layout')).toBeInTheDocument();
    expect(screen.getByTestId('users-layout')).toBeInTheDocument();
    expect(screen.getByText('Users Nav')).toBeInTheDocument();
  });

  it('should update params when navigating within same route', async () => {
    mockAdapter.getLocation.mockResolvedValue('?page=/users/123');

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/users/123');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('User: 123')).toBeInTheDocument();
    });

    // Click button to navigate to different user
    const button = screen.getByText('Go to User 999');
    await act(async () => {
      button.click();
    });

    await waitFor(() => {
      expect(mockAdapter.push).toHaveBeenCalledWith(
        expect.stringContaining('page=/users/999'),
      );
      expect(mockAdapter.push).toHaveBeenCalledWith(
        expect.stringContaining('tab=settings'),
      );
    });

    // Simulate the route change
    await act(async () => {
      onChangeCallback('?page=/users/999&tab=settings');
    });

    await waitFor(() => {
      expect(screen.getByText('User: 999')).toBeInTheDocument();
      expect(screen.getByText('Tab: settings')).toBeInTheDocument();
    });
  });

  it('should maintain layout hierarchy during navigation', async () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    // Start at home
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    // Navigate to user page
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/users/123');
    });

    await waitFor(() => {
      expect(screen.getByText('User: 123')).toBeInTheDocument();
    });

    // Verify layout hierarchy: Root -> Users -> User Page
    const rootLayout = screen.getByTestId('root-layout');
    const usersLayout = screen.getByTestId('users-layout');
    const userContent = screen.getByText('User: 123');

    expect(rootLayout).toContainElement(usersLayout);
    expect(usersLayout).toContainElement(userContent);
  });

  it('should access current route using useRoute hook', async () => {
    mockAdapter.getLocation.mockResolvedValue('?page=/about');

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/about');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Current Route: /about')).toBeInTheDocument();
    });

    const currentRoute = router.getCurrentRoute();
    expect(currentRoute.name).toBe('/about');
    expect(currentRoute.params).toEqual({});
  });
});

import { render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RouterProvider } from '@/adapters/react/provider';
import { RouterOutlet } from '@/adapters/react/RouterOutlet';
import type { Route, Router } from '@/core/router';

// Mock Components
const Page = ({ text }: { text: string }) => <div>Page: {text}</div>;
const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="root-layout">Root {children}</div>
);
const UsersLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="users-layout">Users {children}</div>
);
const NotFound = () => <div>404 Not Found</div>;

// Mock Router
const createMockRouter = (
  initialRoute: Route<string, any>,
  pages: Record<string, React.ComponentType<any>>,
  specialPages: Record<string, React.ComponentType<any>>,
) => {
  const listeners = new Set<(route: any) => void>();
  const currentRoute = initialRoute;

  const router = {
    pages,
    specialPages,
    navigate: vi.fn(),
    subscribe: (listener: (route: any) => void) => {
      listeners.add(listener);
      listener(currentRoute);
      return () => listeners.delete(listener);
    },
    getCurrentRoute: () => currentRoute,
  } as unknown as Router<string, any>;

  return { router };
};

describe('React RouterOutlet', () => {
  it('should render only the page component if no layouts exist', () => {
    const { router } = createMockRouter(
      { name: '/', params: { text: 'Home' } },
      { '/': () => <Page text="Home" /> },
      {},
    );

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    expect(screen.getByText('Page: Home')).toBeInTheDocument();
    expect(screen.queryByTestId('root-layout')).not.toBeInTheDocument();
  });

  it('should render with root and nested layouts', () => {
    const { router } = createMockRouter(
      { name: '/users/profile', params: { text: 'Profile' } },
      { '/users/profile': () => <Page text="Profile" /> },
      {
        _root: RootLayout,
        'users/_layout': UsersLayout,
      },
    );

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    const root = screen.getByTestId('root-layout');
    const users = screen.getByTestId('users-layout');
    const page = screen.getByText('Page: Profile');

    expect(root).toBeInTheDocument();
    expect(users).toBeInTheDocument();
    expect(page).toBeInTheDocument();

    // Check for correct nesting: Root -> Users -> Page
    expect(root).toContainElement(users);
    expect(users).toContainElement(page);
  });

  it('should render 404 component for non-existent routes', () => {
    const { router } = createMockRouter(
      { name: '_404', params: {} },
      { '/': () => <Page text="Home" /> }, // pages object doesn't have the route
      { _404: NotFound },
    );

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    expect(screen.getByText('404 Not Found')).toBeInTheDocument();
  });
});

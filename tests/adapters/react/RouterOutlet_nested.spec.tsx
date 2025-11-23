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
const ParentLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="parent-layout">Parent {children}</div>
);
const ChildLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="child-layout">Child {children}</div>
);

// Mock Router
const createMockRouter = (
  initialRoute: Route<string, any>,
  pages: Record<
    string,
    { component: React.ComponentType<any>; isIndex: boolean }
  >,
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
    isReady: () => true,
  } as unknown as Router<string, any>;

  return { router };
};

describe('React RouterOutlet Nested Layouts', () => {
  it('should render all intermediate layouts', () => {
    const { router } = createMockRouter(
      { name: '/parent/child/page', params: { text: 'Deep Page' } },
      {
        '/parent/child/page': {
          component: () => <Page text="Deep Page" />,
          isIndex: false,
        },
      },
      {
        _root: RootLayout,
        'parent/_layout': ParentLayout,
        'parent/child/_layout': ChildLayout,
      },
    );

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    const root = screen.getByTestId('root-layout');
    const parent = screen.queryByTestId('parent-layout');
    const child = screen.getByTestId('child-layout');
    const page = screen.getByText('Page: Deep Page');

    expect(root).toBeInTheDocument();
    expect(parent).toBeInTheDocument();
    expect(child).toBeInTheDocument();
    expect(page).toBeInTheDocument();

    // Check for correct nesting: Root -> Parent -> Child -> Page
    expect(root).toContainElement(parent);
    expect(parent).toContainElement(child);
    expect(child).toContainElement(page);
  });
});

import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { useParams } from '@/adapters/react/hooks';
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
const UserPage = () => {
  const params = useParams('/users/[userId]');
  return (
    <div>
      <h1>User: {params.userId}</h1>
      {params.age !== undefined && <p>Age: {params.age}</p>}
      {params.role && <p>Role: {params.role}</p>}
    </div>
  );
};

const ProductPage = () => {
  const params = useParams('/products/[productId]');
  return (
    <div>
      <h1>Product ID: {params.productId}</h1>
      <p>Price: ${params.price}</p>
      {params.inStock !== undefined && (
        <p>In Stock: {params.inStock ? 'Yes' : 'No'}</p>
      )}
    </div>
  );
};

const SearchPage = () => {
  const params = useParams('/search');
  return (
    <div>
      <h1>Search Results</h1>
      <p>Query: {params.query}</p>
      {params.pageNum !== undefined && <p>Page: {params.pageNum}</p>}
      {params.sort && <p>Sort: {params.sort}</p>}
    </div>
  );
};

const NotFound = () => (
  <div>
    <h1>404 Not Found</h1>
    <p>Invalid route or parameters</p>
  </div>
);

describe('React Integration - Parameter Validation', () => {
  let router: Router<string, any>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAdapter.getLocation.mockResolvedValue('?page=/');

    const pages = {
      '/users/[userId]': {
        component: UserPage,
        isIndex: false,
        schema: z.object({
          userId: z.string().min(1),
          age: z.coerce.number().int().positive().optional(),
          role: z.enum(['admin', 'user', 'guest']).optional(),
        }),
      },
      '/products/[productId]': {
        component: ProductPage,
        isIndex: false,
        schema: z.object({
          productId: z.string().uuid(),
          price: z.coerce.number().positive(),
          inStock: z
            .string()
            .optional()
            .transform((val) => {
              if (val === undefined) return undefined;
              if (val === 'true') return true;
              if (val === 'false') return false;
              return Boolean(val);
            }),
        }),
      },
      '/search': {
        component: SearchPage,
        isIndex: false,
        schema: z.object({
          query: z.string().min(1),
          pageNum: z.coerce.number().int().positive().optional(),
          sort: z.enum(['relevance', 'date', 'popularity']).optional(),
        }),
      },
      _404: {
        component: NotFound,
        isIndex: false,
      },
    };

    const dynamicRoutes = [
      {
        name: '/users/[userId]',
        pattern: /^\/users\/([^/]+)$/,
        paramNames: ['userId'],
      },
      {
        name: '/products/[productId]',
        pattern: /^\/products\/([^/]+)$/,
        paramNames: ['productId'],
      },
    ];

    router = createRouter(pages, {
      dynamicRoutes,
      defaultRouteName: '_404',
    });

    await waitFor(() => expect(router.isReady()).toBe(true));
  });

  it('should validate and accept valid parameters', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/users/john&age=25&role=admin');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('User: john')).toBeInTheDocument();
      expect(screen.getByText('Age: 25')).toBeInTheDocument();
      expect(screen.getByText('Role: admin')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('/users/[userId]');
    expect(route.params).toEqual({
      userId: 'john',
      age: 25,
      role: 'admin',
    });
  });

  it('should coerce string to number for numeric parameters', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/users/alice&age=30');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('User: alice')).toBeInTheDocument();
      expect(screen.getByText('Age: 30')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.params.age).toBe(30);
    expect(typeof route.params.age).toBe('number');
  });

  it('should fall back to 404 for invalid enum value', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      // 'superadmin' is not a valid role
      onChangeCallback('?page=/users/bob&role=superadmin');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('404 Not Found')).toBeInTheDocument();
      expect(
        screen.getByText('Invalid route or parameters'),
      ).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('_404');
  });

  it('should fall back to 404 for invalid number format', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      // 'invalid' cannot be coerced to a number
      onChangeCallback('?page=/users/charlie&age=invalid');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('404 Not Found')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('_404');
  });

  it('should fall back to 404 for negative age', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      // age must be positive
      onChangeCallback('?page=/users/dave&age=-5');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('404 Not Found')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('_404');
  });

  it('should validate UUID format for productId', async () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback(`?page=/products/${validUuid}&price=99.99&inStock=true`);
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(`Product ID: ${validUuid}`)).toBeInTheDocument();
      expect(screen.getByText('Price: $99.99')).toBeInTheDocument();
      expect(screen.getByText('In Stock: Yes')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('/products/[productId]');
    expect(route.params).toEqual({
      productId: validUuid,
      price: 99.99,
      inStock: true,
    });
  });

  it('should fall back to 404 for invalid UUID', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/products/not-a-uuid&price=50');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('404 Not Found')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('_404');
  });

  it('should coerce boolean from string', async () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback(`?page=/products/${validUuid}&price=25.5&inStock=false`);
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('In Stock: No')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.params.inStock).toBe(false);
    expect(typeof route.params.inStock).toBe('boolean');
  });

  it('should validate required parameters', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      // Missing required 'query' parameter
      onChangeCallback('?page=/search&pageNum=2');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('404 Not Found')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('_404');
  });

  it('should validate search with all valid parameters', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback(
        '?page=/search&query=typescript&pageNum=3&sort=popularity',
      );
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Query: typescript')).toBeInTheDocument();
      expect(screen.getByText('Page: 3')).toBeInTheDocument();
      expect(screen.getByText('Sort: popularity')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.params).toEqual({
      query: 'typescript',
      pageNum: 3,
      sort: 'popularity',
    });
  });

  it('should strip unknown parameters after validation', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      // 'unknownParam' is not in the schema
      onChangeCallback('?page=/users/eve&unknownParam=value');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('User: eve')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.params).toEqual({ userId: 'eve' });
    expect(route.params).not.toHaveProperty('unknownParam');
  });
});

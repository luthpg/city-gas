import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavigate, useParams } from '@/adapters/react/hooks';
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
const UserDetailPage = () => {
  const params = useParams('/users/[userId]');
  return (
    <div>
      <h1>User Detail: {params.userId}</h1>
    </div>
  );
};

const PostPage = () => {
  const params = useParams('/posts/[postId]');
  return (
    <div>
      <h1>Post {params.postId}</h1>
      {params.commentId && <p>Comment: {params.commentId}</p>}
    </div>
  );
};

const ItemEditPage = () => {
  const params = useParams('/items/[itemId]/edit');
  const navigate = useNavigate();
  return (
    <div>
      <h1>Edit Item {params.itemId}</h1>
      {params.section && <p>Section: {params.section}</p>}
      <button
        type="button"
        onClick={() =>
          navigate('/items/[itemId]/edit', {
            itemId: 'new-item',
            section: 'advanced',
          })
        }
      >
        Edit New Item
      </button>
    </div>
  );
};

const ProductPage = () => {
  const params = useParams('/shops/[shopId]/products/[productId]');
  return (
    <div>
      <h1>
        Product {params.productId} from Shop {params.shopId}
      </h1>
    </div>
  );
};

const NotFound = () => <div>404 Not Found</div>;

describe('React Integration - Dynamic Routes', () => {
  let router: Router<string, any>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAdapter.getLocation.mockResolvedValue('?page=/');

    const pages = {
      '/users/[userId]': { component: UserDetailPage, isIndex: false },
      '/posts/[postId]': { component: PostPage, isIndex: false },
      '/items/[itemId]/edit': { component: ItemEditPage, isIndex: false },
      '/shops/[shopId]/products/[productId]': {
        component: ProductPage,
        isIndex: false,
      },
    };

    const specialPages = {
      _404: NotFound,
    };

    const dynamicRoutes = [
      {
        name: '/users/[userId]',
        pattern: /^\/users\/([^/]+)$/,
        paramNames: ['userId'],
      },
      {
        name: '/posts/[postId]',
        pattern: /^\/posts\/([^/]+)$/,
        paramNames: ['postId'],
      },
      {
        name: '/items/[itemId]/edit',
        pattern: /^\/items\/([^/]+)\/edit$/,
        paramNames: ['itemId'],
      },
      {
        name: '/shops/[shopId]/products/[productId]',
        pattern: /^\/shops\/([^/]+)\/products\/([^/]+)$/,
        paramNames: ['shopId', 'productId'],
      },
    ];

    router = createRouter(pages, {
      specialPages,
      dynamicRoutes,
      defaultRouteName: '/users/[userId]',
    });

    await waitFor(() => expect(router.isReady()).toBe(true));
  });

  it('should resolve single dynamic parameter from URL', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/users/alice');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('User Detail: alice')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('/users/[userId]');
    expect(route.params).toEqual({ userId: 'alice' });
  });

  it('should resolve dynamic parameter with additional query params', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/posts/123&commentId=456');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Post 123')).toBeInTheDocument();
      expect(screen.getByText('Comment: 456')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('/posts/[postId]');
    expect(route.params).toEqual({ postId: '123', commentId: '456' });
  });

  it('should resolve dynamic route with static segments', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/items/item-42/edit&section=basic');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Item item-42')).toBeInTheDocument();
      expect(screen.getByText('Section: basic')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('/items/[itemId]/edit');
    expect(route.params).toEqual({ itemId: 'item-42', section: 'basic' });
  });

  it('should resolve multiple dynamic parameters', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/shops/shop-1/products/product-99');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Product product-99 from Shop shop-1'),
      ).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('/shops/[shopId]/products/[productId]');
    expect(route.params).toEqual({ shopId: 'shop-1', productId: 'product-99' });
  });

  it('should navigate between dynamic routes programmatically', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/items/old-item/edit');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Item old-item')).toBeInTheDocument();
    });

    // Navigate to new item
    const button = screen.getByText('Edit New Item');
    await act(async () => {
      button.click();
    });

    await waitFor(() => {
      expect(mockAdapter.push).toHaveBeenCalledWith(
        expect.stringContaining('page=/items/new-item/edit'),
      );
      expect(mockAdapter.push).toHaveBeenCalledWith(
        expect.stringContaining('section=advanced'),
      );
    });

    // Simulate route change
    await act(async () => {
      onChangeCallback('?page=/items/new-item/edit&section=advanced');
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Item new-item')).toBeInTheDocument();
      expect(screen.getByText('Section: advanced')).toBeInTheDocument();
    });
  });

  it('should handle URL-encoded dynamic parameters', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      // URL-encoded string "user name"
      onChangeCallback('?page=/users/user%20name');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('User Detail: user name')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.params.userId).toBe('user name');
  });

  it('should handle special characters in dynamic parameters', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      onChangeCallback('?page=/posts/post-123-abc');
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Post post-123-abc')).toBeInTheDocument();
    });

    const route = router.getCurrentRoute();
    expect(route.params.postId).toBe('post-123-abc');
  });

  it('should fall back to 404 for invalid dynamic route pattern', async () => {
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    await act(async () => {
      // This doesn't match any pattern
      onChangeCallback('?page=/users/123/invalid/path');
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
});

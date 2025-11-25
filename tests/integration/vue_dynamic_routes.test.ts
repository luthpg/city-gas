import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createRouterPlugin, RouterOutlet } from '@/adapters/vue';
import { useParams } from '@/adapters/vue/composables';
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
const UserDetailPage = defineComponent({
  name: 'UserDetailPage',
  setup() {
    const params = useParams('/users/[userId]');
    return () => h('div', [h('h1', `User Detail: ${params.value.userId}`)]);
  },
});

const ProductPage = defineComponent({
  name: 'ProductPage',
  setup() {
    const params = useParams('/shops/[shopId]/products/[productId]');
    return () =>
      h('div', [
        h(
          'h1',
          `Product ${params.value.productId} from Shop ${params.value.shopId}`,
        ),
      ]);
  },
});

const NotFound = defineComponent({
  name: 'NotFound',
  setup() {
    return () => h('div', '404 Not Found');
  },
});

describe('Vue Integration - Dynamic Routes', () => {
  let router: Router<string, any>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAdapter.getLocation.mockResolvedValue('?page=/');

    const pages = {
      '/users/[userId]': { component: UserDetailPage, isIndex: false },
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

    await vi.waitFor(() => expect(router.isReady()).toBe(true));
  });

  it('should resolve single dynamic parameter from URL', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/users/alice');

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('User Detail: alice');
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('/users/[userId]');
    expect(route.params).toEqual({ userId: 'alice' });
  });

  it('should resolve multiple dynamic parameters', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/shops/shop-1/products/product-99');

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('Product product-99 from Shop shop-1');
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('/shops/[shopId]/products/[productId]');
    expect(route.params).toEqual({ shopId: 'shop-1', productId: 'product-99' });
  });

  it('should handle URL-encoded dynamic parameters', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/users/user%20name');

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('User Detail: user name');
    });

    const route = router.getCurrentRoute();
    expect(route.params.userId).toBe('user name');
  });

  it('should fall back to 404 for invalid dynamic route pattern', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/users/123/invalid/path');

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('404 Not Found');
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('_404');
  });
});

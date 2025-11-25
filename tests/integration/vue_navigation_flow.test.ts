import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createRouterPlugin, RouterOutlet } from '@/adapters/vue';
import { useNavigate, useParams, useRoute } from '@/adapters/vue/composables';
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
const HomePage = defineComponent({
  name: 'HomePage',
  setup() {
    const navigate = useNavigate();
    return () =>
      h('div', [
        h('h1', 'Home Page'),
        h('button', { onClick: () => navigate('/about', {}) }, 'Go to About'),
      ]);
  },
});

const AboutPage = defineComponent({
  name: 'AboutPage',
  setup() {
    const navigate = useNavigate();
    const route = useRoute();
    return () =>
      h('div', [
        h('h1', 'About Page'),
        h('p', `Current Route: ${route.value.name}`),
        h('button', { onClick: () => navigate('/', {}) }, 'Go to Home'),
      ]);
  },
});

const UserPage = defineComponent({
  name: 'UserPage',
  setup() {
    const params = useParams('/users/[userId]');
    const navigate = useNavigate();
    return () =>
      h('div', [
        h('h1', `User: ${params.value.userId}`),
        params.value.tab ? h('p', `Tab: ${params.value.tab}`) : null,
        h(
          'button',
          {
            onClick: () =>
              navigate('/users/[userId]', { userId: '999', tab: 'settings' }),
          },
          'Go to User 999',
        ),
      ]);
  },
});

const RootLayout = defineComponent({
  name: 'RootLayout',
  setup(_, { slots }) {
    return () =>
      h('div', { 'data-testid': 'root-layout' }, [
        h('header', 'Header'),
        slots.default?.(),
        h('footer', 'Footer'),
      ]);
  },
});

const UsersLayout = defineComponent({
  name: 'UsersLayout',
  setup(_, { slots }) {
    return () =>
      h('div', { 'data-testid': 'users-layout' }, [
        h('nav', 'Users Nav'),
        slots.default?.(),
      ]);
  },
});

const NotFound = defineComponent({
  name: 'NotFound',
  setup() {
    return () => h('div', '404 Not Found');
  },
});

describe('Vue Integration - Navigation Flow', () => {
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
    await vi.waitFor(() => expect(router.isReady()).toBe(true));
  });

  it('should render initial route with root layout', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain('Home Page');
    expect(wrapper.find('[data-testid="root-layout"]').exists()).toBe(true);
    expect(wrapper.html()).toContain('Header');
    expect(wrapper.html()).toContain('Footer');
  });

  it('should navigate between pages using useNavigate composable', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.html()).toContain('Home Page');

    // Simulate navigation
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/about');

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('About Page');
    });
    expect(wrapper.html()).toContain('Current Route: /about');
  });

  it('should navigate to dynamic route and display params', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/users/123&tab=profile');

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('User: 123');
    });
    expect(wrapper.html()).toContain('Tab: profile');

    // Check nested layouts
    expect(wrapper.find('[data-testid="root-layout"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="users-layout"]').exists()).toBe(true);
    expect(wrapper.html()).toContain('Users Nav');
  });

  it('should update params when navigating within same route', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/users/123');

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('User: 123');
    });

    // Trigger navigation to different user
    mockAdapter.push.mockClear();
    const button = wrapper.find('button');
    await button.trigger('click');

    await vi.waitFor(() => {
      expect(mockAdapter.push).toHaveBeenCalledWith(
        expect.stringContaining('page=/users/999'),
      );
    });

    // Simulate the route change
    onChangeCallback('?page=/users/999&tab=settings');

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('User: 999');
    });
    expect(wrapper.html()).toContain('Tab: settings');
  });

  it('should maintain layout hierarchy during navigation', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.html()).toContain('Home Page');

    // Navigate to user page
    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/users/123');

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('User: 123');
    });

    // Verify layout hierarchy exists
    const rootLayout = wrapper.find('[data-testid="root-layout"]');
    const usersLayout = wrapper.find('[data-testid="users-layout"]');

    expect(rootLayout.exists()).toBe(true);
    expect(usersLayout.exists()).toBe(true);

    // Root should contain users layout
    expect(rootLayout.html()).toContain('data-testid="users-layout"');
  });

  it('should access current route using useRoute composable', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];
    onChangeCallback('?page=/about');

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('Current Route: /about');
    });

    const currentRoute = router.getCurrentRoute();
    expect(currentRoute.name).toBe('/about');
    expect(currentRoute.params).toEqual({});
  });

  it('should reactively update when route changes', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.html()).toContain('Home Page');

    const onChangeCallback = mockAdapter.onChange.mock.calls[0][0];

    // Navigate to about
    onChangeCallback('?page=/about');
    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('About Page');
    });

    // Navigate back to home
    onChangeCallback('?page=/');
    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('Home Page');
    });
  });
});

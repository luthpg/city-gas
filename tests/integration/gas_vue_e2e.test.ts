import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createRouterPlugin, RouterOutlet } from '@/adapters/vue';
import { useNavigate, useParams, useRoute } from '@/adapters/vue/composables';
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
    const params = useParams<'/users/[userId]'>('/users/[userId]');
    return () =>
      h('div', [
        h('h1', `User: ${params.value.userId}`),
        params.value.role ? h('p', `Role: ${params.value.role}`) : null,
      ]);
  },
});

const NotFound = defineComponent({
  name: 'NotFound',
  setup() {
    return () => h('div', '404 Not Found');
  },
});

describe('GAS Vue E2E - Navigation Flow', () => {
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

    await vi.waitFor(() => expect(router.isReady()).toBe(true));
  });

  it('should initialize with GAS getLocation', async () => {
    expect(mockGoogleScript.url.getLocation).toHaveBeenCalled();
    expect(router.getCurrentRoute().name).toBe('/');
  });

  it('should navigate using google.script.history.push', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('Home Page');
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
    mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

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
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('Home Page');
    });

    // Verify setChangeHandler was registered
    expect(mockGoogleScript.history.setChangeHandler).toHaveBeenCalled();

    // Get the change handler
    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];

    // Simulate navigation event from GAS
    changeHandler({
      location: {
        parameter: {
          page: '/about',
        },
      },
    });

    await wrapper.vm.$nextTick();

    // Verify UI updated
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('About Page');
      expect(wrapper.html()).toContain('Current Route: /about');
    });
  });

  it('should handle dynamic routes through GAS change handler', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];

    // Simulate navigation to dynamic route via GAS
    changeHandler({
      location: {
        parameter: {
          page: '/users/bob',
          role: 'user',
        },
      },
    });

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('User: bob');
      expect(wrapper.html()).toContain('Role: user');
    });

    const route = router.getCurrentRoute();
    expect(route.name).toBe('/users/[userId]');
    expect(route.params).toEqual({ userId: 'bob', role: 'user' });
  });

  it('should use google.script.history.replace for replace navigation', async () => {
    mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    router.navigate('/about', {}, { replace: true });

    expect(mockGoogleScript.history.replace).toHaveBeenCalledWith(
      {},
      { page: '/about' },
      '',
    );
    expect(mockGoogleScript.history.push).not.toHaveBeenCalled();
  });

  it('should handle 404 routes in GAS environment', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];

    // Simulate navigation to non-existent route
    changeHandler({
      location: {
        parameter: {
          page: '/non-existent',
        },
      },
    });

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('404 Not Found');
    });

    expect(router.getCurrentRoute().name).toBe('_404');
  });

  it('should handle back/forward simulation via GAS events', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];

    // Navigate to about
    changeHandler({
      location: { parameter: { page: '/about' } },
    });

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('About Page');
    });

    // Simulate back navigation
    changeHandler({
      location: { parameter: { page: '/' } },
    });

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('Home Page');
    });
  });

  it('should handle parameters format with arrays', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];

    // Simulate navigation with parameters (array format)
    changeHandler({
      location: {
        parameters: {
          page: ['/users/charlie'],
          role: ['admin'],
        },
      },
    });

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('User: charlie');
      expect(wrapper.html()).toContain('Role: admin');
    });
  });

  it('should reactively update when route changes in GAS', async () => {
    const wrapper = mount(RouterOutlet, {
      global: {
        plugins: [createRouterPlugin(router)],
      },
    });

    const changeHandler =
      mockGoogleScript.history.setChangeHandler.mock.calls[0][0];

    // Navigate to about
    changeHandler({
      location: { parameter: { page: '/about' } },
    });

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('About Page');
    });

    // Navigate to user
    changeHandler({
      location: { parameter: { page: '/users/dave', role: 'guest' } },
    });

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('User: dave');
      expect(wrapper.html()).toContain('Role: guest');
    });

    // Navigate back to home
    changeHandler({
      location: { parameter: { page: '/' } },
    });

    await wrapper.vm.$nextTick();
    await vi.waitFor(() => {
      expect(wrapper.html()).toContain('Home Page');
    });
  });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, markRaw } from 'vue';
import { routerKey } from '@/adapters/vue/key';
import { RouterOutlet } from '@/adapters/vue/RouterOutlet';
import type { Route, Router } from '@/core/router';

// Mock Components
const Page = defineComponent({
  props: { text: String },
  setup(props) {
    return () => h('div', `Page: ${props.text}`);
  },
});
const RootLayout = defineComponent({
  setup(_, { slots }) {
    return () =>
      h('div', { 'data-testid': 'root-layout' }, [
        'Root ',
        slots.default ? slots.default() : [],
      ]);
  },
});
const UsersLayout = defineComponent({
  setup(_, { slots }) {
    return () =>
      h('div', { 'data-testid': 'users-layout' }, [
        'Users ',
        slots.default ? slots.default() : [],
      ]);
  },
});
const NotFound = defineComponent({
  setup() {
    return () => h('div', '404 Not Found');
  },
});

// Mock Router
const createMockRouter = (
  initialRoute: Route<string, any>,
  pages: Record<string, { component: any; isIndex: boolean }>,
  specialPages: Record<string, any>,
) => {
  const listeners = new Set<(route: any) => void>();
  const currentRoute = initialRoute;

  const router = {
    pages: markRaw(pages),
    specialPages: markRaw(specialPages),
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

describe('Vue RouterOutlet', () => {
  const mountWithRouter = (router: Router<string, any>) => {
    return mount(RouterOutlet, {
      global: {
        provide: {
          [routerKey as any]: { router },
        },
      },
    });
  };

  it('should render only the page component if no layouts exist', () => {
    const { router } = createMockRouter(
      { name: '/', params: { text: 'Home' } },
      { '/': { component: Page, isIndex: true } },
      {},
    );

    const wrapper = mountWithRouter(router);

    expect(wrapper.html()).toContain('Page: Home');
    expect(wrapper.find('[data-testid="root-layout"]').exists()).toBe(false);
  });

  it('should render with root and nested layouts', () => {
    const { router } = createMockRouter(
      { name: '/users/profile', params: { text: 'Profile' } },
      { '/users/profile': { component: Page, isIndex: false } },
      {
        _root: RootLayout,
        'users/_layout': UsersLayout,
      },
    );

    const wrapper = mountWithRouter(router);

    const root = wrapper.find('[data-testid="root-layout"]');
    const users = root.find('[data-testid="users-layout"]');

    expect(root.exists()).toBe(true);
    expect(users.exists()).toBe(true);
    expect(users.html()).toContain('Page: Profile');
    expect(root.html()).toContain('Users');
  });

  it('should render 404 component for non-existent routes', () => {
    const { router } = createMockRouter(
      { name: '_404', params: {} },
      { '/': { component: Page, isIndex: true } }, // pages object doesn't have the route
      { _404: NotFound },
    );

    const wrapper = mountWithRouter(router);

    expect(wrapper.html()).toContain('404 Not Found');
  });

  it('should apply layouts to nested index routes', () => {
    const { router } = createMockRouter(
      { name: '/users', params: { text: 'Users Index' } },
      {
        '/users': { component: Page, isIndex: true },
        '/users/show': { component: Page, isIndex: false },
      },
      {
        _root: RootLayout,
        'users/_layout': UsersLayout,
      },
    );

    const wrapper = mountWithRouter(router);
    const root = wrapper.find('[data-testid="root-layout"]');
    const users = root.find('[data-testid="users-layout"]');

    expect(root.exists()).toBe(true);
    expect(users.exists()).toBe(true);
    expect(users.html()).toContain('Page: Users Index');
  });

  it('should apply layout to a nested index route without other child routes', () => {
    const ProfileLayout = defineComponent({
      setup(_, { slots }) {
        return () =>
          h('div', { 'data-testid': 'profile-layout' }, [
            'Profile ',
            slots.default ? slots.default() : [],
          ]);
      },
    });

    const { router } = createMockRouter(
      { name: '/profile', params: { text: 'Profile Index' } },
      {
        '/profile': { component: Page, isIndex: true },
      },
      {
        _root: RootLayout,
        'profile/_layout': ProfileLayout,
      },
    );

    const wrapper = mountWithRouter(router);
    const root = wrapper.find('[data-testid="root-layout"]');
    const profile = root.find('[data-testid="profile-layout"]');

    expect(root.exists()).toBe(true);
    expect(profile.exists()).toBe(true);
    expect(profile.html()).toContain('Page: Profile Index');
  });
});

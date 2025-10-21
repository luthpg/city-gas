import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import type { Route, Router } from '@/core/router';
import {
  useNavigate,
  useParams,
  useRoute,
} from '../../src/adapters/vue/composables';
import { routerKey } from '../../src/adapters/vue/key';

// Mock data and types
type AppRouteNames = '' | 'profile';
interface AppRouteParams {
  '': {};
  profile: { id: string };
}

// Mock router
const createMockRouter = (
  initialRoute: Route<AppRouteNames, AppRouteParams>,
) => {
  const listeners = new Set<(route: any) => void>();
  const currentRouteRef = ref(initialRoute);

  const router = {
    navigate: vi.fn((name, params) => {
      currentRouteRef.value = { name, params };
    }),
    subscribe: (listener: (route: any) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getCurrentRoute: () => currentRouteRef.value,
  } as unknown as Router<AppRouteNames, AppRouteParams>;

  return { router, currentRouteRef };
};

describe('Vue Composables', () => {
  let mockRouter: Router<AppRouteNames, AppRouteParams>;
  let currentRouteRef: any;

  beforeEach(() => {
    const { router, currentRouteRef: routeRef } = createMockRouter({
      name: '',
      params: {},
    });
    mockRouter = router;
    currentRouteRef = routeRef;
  });

  const TestComponent = defineComponent({
    setup() {
      const route = useRoute<AppRouteNames, AppRouteParams>();
      const params = useParams<AppRouteNames, AppRouteParams>();
      const navigate = useNavigate<AppRouteNames, AppRouteParams>();

      return () =>
        h('div', [
          h('div', { 'data-testid': 'route-name' }, route.value.name),
          h('div', { 'data-testid': 'params-id' }, (params.value as any)?.id),
          h(
            'button',
            { onClick: () => navigate('profile', { id: '123' }) },
            'Go',
          ),
        ]);
    },
  });

  const mountComponent = () => {
    return mount(TestComponent, {
      global: {
        provide: {
          [routerKey as any]: {
            router: mockRouter,
            currentRoute: currentRouteRef,
          },
        },
      },
    });
  };

  it('useRoute should return the current route', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-testid="route-name"]').text()).toBe('');
  });

  it('useParams should return the current params', async () => {
    currentRouteRef.value = { name: 'profile', params: { id: '456' } };
    const wrapper = mountComponent();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="params-id"]').text()).toBe('456');
  });

  it('useNavigate should call the router navigate method', async () => {
    const wrapper = mountComponent();
    await wrapper.find('button').trigger('click');
    expect(mockRouter.navigate).toHaveBeenCalledWith('profile', { id: '123' });
  });

  it('composables should update when the route changes', async () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-testid="route-name"]').text()).toBe('');

    currentRouteRef.value = { name: 'profile', params: { id: '789' } };
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="route-name"]').text()).toBe('profile');
    expect(wrapper.find('[data-testid="params-id"]').text()).toBe('789');
  });
});

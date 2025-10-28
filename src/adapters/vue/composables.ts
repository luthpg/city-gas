import { type DeepReadonly, onUnmounted, type Ref, readonly, ref } from 'vue';
import { useRouterContext } from '@/adapters/vue/plugin';
import type {
  RegisteredRouteNames,
  RegisteredRouteParams,
  Route,
} from '@/core/router';

function useStore<
  Snapshot,
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>(selector: (route: Route<R, P>) => Snapshot) {
  const { router } = useRouterContext<R, P>();

  const state = ref(selector(router.getCurrentRoute()));

  const unsubscribe = router.subscribe((newRoute) => {
    state.value = selector(newRoute);
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return readonly(state);
}

export function useRoute<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>() {
  return useStore<Route<R, P>, R, P>((route) => route);
}

export function useRouter<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>() {
  return useRouterContext<R, P>().router;
}

export function useNavigate<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>() {
  return useRouterContext<R, P>().router.navigate;
}

export function useParams<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>(): DeepReadonly<Ref<P[R]>> {
  return useStore((route) => route.params);
}

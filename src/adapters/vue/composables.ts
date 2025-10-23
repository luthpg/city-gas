import { onUnmounted, readonly, ref, type DeepReadonly, type Ref } from 'vue';
import { useRouterContext } from '@/adapters/vue/plugin';
import type {
  RegisteredRouteNames,
  RegisteredRouteParams,
  Route,
  Router,
} from '@/core/router';

function useStore<
  Snapshot,
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>(selector: (route: Route<R, P>) => Snapshot): DeepReadonly<Ref<Snapshot>> {
  const { router } = useRouterContext<R, P>();

  const state = ref(selector(router.getCurrentRoute()));

  const unsubscribe = router.subscribe((newRoute) => {
    // This is not ideal, but vue doesn't have a way to compare snapshots
    // so we have to update the state every time.
    // @ts-ignore
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
>(): DeepReadonly<Ref<Route<R, P>>> {
  return useStore<Route<R, P>, R, P>((route) => route);
}

export function useRouter<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>(): Router<R, P> {
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

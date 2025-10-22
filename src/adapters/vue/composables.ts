import { computed } from 'vue';
import { useRouterContext } from '@/adapters/vue/plugin';
import type {
  RegisteredRouteNames,
  RegisteredRouteParams,
  Router,
} from '@/core/router';

export function useRoute<
  R extends string = RegisteredRouteNames,
  P extends Record<R, any> = RegisteredRouteParams,
>() {
  return useRouterContext<R, P>().route;
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
>() {
  const { route } = useRouterContext<R, P>();
  return computed(() => route.value.params);
}

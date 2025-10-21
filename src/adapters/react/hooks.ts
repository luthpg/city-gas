import { useRouterContext } from '@/adapters/react/provider';
import type { Router } from '@/core/router';

export function useRoute<R extends string, P extends Record<R, any>>() {
  return useRouterContext<R, P>().route;
}

export function useRouter<R extends string, P extends Record<R, any>>(): Router<
  R,
  P
> {
  return useRouterContext<R, P>().router;
}

export function useNavigate<R extends string, P extends Record<R, any>>() {
  return useRouterContext<R, P>().router.navigate;
}

export function useParams<R extends string, P extends Record<R, any>>() {
  return useRouterContext<R, P>().route.params;
}

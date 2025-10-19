import { useSafeContext } from './provider';

export function useRoute() {
  return useSafeContext().route;
}

export function useNavigate() {
  return useSafeContext().router.navigate;
}

export function useParams() {
  return useSafeContext().route.params;
}

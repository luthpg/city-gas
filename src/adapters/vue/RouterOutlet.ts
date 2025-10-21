import { defineComponent, h } from 'vue';
import { useRoute, useRouter } from '@/adapters/vue/composables';

export const RouterOutlet = defineComponent({
  name: 'RouterOutlet',
  setup() {
    const route = useRoute();
    const router = useRouter();
    return () => {
      if (!route.value) return null;
      const Comp = router.pages[route.value.name] as any;
      if (!Comp) return null;
      return h(Comp, route.value.params);
    };
  },
});

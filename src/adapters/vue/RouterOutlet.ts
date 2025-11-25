import { defineComponent, h, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from '@/adapters/vue/composables';
import { DefaultLoading, DefaultNotFound } from '@/adapters/vue/defaults';

export const RouterOutlet = defineComponent({
  name: 'RouterOutlet',
  setup() {
    const route = useRoute();
    const router = useRouter();

    const isReady = ref(router.isReady());

    const unsubscribe = router.subscribe(() => {
      isReady.value = router.isReady();
    });

    onUnmounted(() => {
      unsubscribe();
    });

    return () => {
      const { pages, specialPages } = router;
      if (!isReady.value) {
        const LoadingComponent = specialPages._loading;
        if (LoadingComponent) {
          return h(LoadingComponent);
        }
        return h(DefaultLoading);
      }
      if (!route.value) return null;

      const { name, params } = route.value;

      const pageInfo = pages[name] as {
        component: any;
        isIndex: boolean;
      };

      if (!pageInfo) {
        const NotFoundComponent = specialPages._404;
        if (NotFoundComponent) {
          return h(NotFoundComponent);
        }
        return h(DefaultNotFound);
      }

      const { component: PageComponent, isIndex } = pageInfo;

      const pathParts = name.split('/').filter(Boolean);
      const parentPathParts = isIndex ? pathParts : pathParts.slice(0, -1);
      let nodeToRender = h(PageComponent, params);

      for (let i = parentPathParts.length; i > 0; i--) {
        const potentialLayoutPath = [
          ...parentPathParts.slice(0, i),
          '_layout',
        ].join('/');
        if (specialPages[potentialLayoutPath]) {
          const LayoutComponent = specialPages[potentialLayoutPath];
          const innerNode = nodeToRender;
          nodeToRender = h(LayoutComponent, null, { default: () => innerNode });
        }
      }

      const RootComponent = specialPages._root;

      if (RootComponent) {
        const innerNode = nodeToRender;
        nodeToRender = h(RootComponent, null, { default: () => innerNode });
      }

      return nodeToRender;
    };
  },
});

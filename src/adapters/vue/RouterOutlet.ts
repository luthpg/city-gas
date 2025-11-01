import { defineComponent, h } from 'vue';
import { useRoute, useRouter } from '@/adapters/vue/composables';

export const RouterOutlet = defineComponent({
  name: 'RouterOutlet',
  setup() {
    const route = useRoute();
    const router = useRouter();

    return () => {
      if (!route.value) return null;

      const { name, params } = route.value;
      const { pages, specialPages } = router;

      const PageComponent = pages[name];

      if (!PageComponent) {
        const NotFoundComponent = specialPages._404;
        if (NotFoundComponent) {
          return h(NotFoundComponent);
        }
        return h('div', '404 Not Found.');
      }

      const pathParts = name.split('/').filter(Boolean).slice(0, -1);
      let LayoutComponent = null;

      for (let i = pathParts.length; i >= 0; i--) {
        const potentialLayoutPath = [...pathParts.slice(0, i), '_layout'].join(
          '/',
        );
        if (specialPages[potentialLayoutPath]) {
          LayoutComponent = specialPages[potentialLayoutPath];
          break;
        }
      }

      const RootComponent = specialPages._root;

      let nodeToRender = h(PageComponent, params);

      if (LayoutComponent) {
        const innerNode = nodeToRender;
        nodeToRender = h(LayoutComponent, null, { default: () => innerNode });
      }

      if (RootComponent) {
        const innerNode = nodeToRender;
        nodeToRender = h(RootComponent, null, { default: () => innerNode });
      }

      return nodeToRender;
    };
  },
});

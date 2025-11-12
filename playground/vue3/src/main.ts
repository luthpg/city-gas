import { createRouter } from '@ciderjs/city-gas';
import { createRouterPlugin, RouterOutlet } from '@ciderjs/city-gas/vue';
import { createApp } from 'vue';
import { pages, specialPages } from './generated/routes';

function main() {
  const router = createRouter(pages, { specialPages });
  createApp(RouterOutlet).use(createRouterPlugin(router)).mount('#root');
}

main();

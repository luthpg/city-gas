import path from 'node:path';
import type { PluginOption, ResolvedConfig } from 'vite';
import { generate } from '@/plugin/generator';

export function cityGasRouter(): PluginOption {
  let config: ResolvedConfig;

  return {
    name: 'city-gas-router',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async buildStart() {
      await generate(config.root);
    },
    configureServer(server) {
      const pagesDir = path.resolve(config.root, 'src/pages');

      server.watcher
        .on('add', async (file) => {
          if (file.startsWith(pagesDir)) {
            await generate(config.root);
          }
        })
        .on('change', async (file) => {
          if (file.startsWith(pagesDir)) {
            await generate(config.root);
          }
        })
        .on('unlink', async (file) => {
          if (file.startsWith(pagesDir)) {
            await generate(config.root);
          }
        });
    },
  };
}

import path from 'node:path';
import type { PluginOption, ResolvedConfig } from 'vite';
import { generate, removeFile, updateFile } from '@/plugin/generator';

export function cityGasRouter(): PluginOption {
  let config: ResolvedConfig;

  return {
    name: 'city-gas-router',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async buildStart() {
      // 初回は全スキャンして生成
      await generate(config.root);
    },
    configureServer(server) {
      const pagesDir = path.resolve(config.root, 'src/pages');

      server.watcher
        .on('add', async (file) => {
          if (file.startsWith(pagesDir)) {
            await updateFile(file, config.root);
          }
        })
        .on('change', async (file) => {
          if (file.startsWith(pagesDir)) {
            await updateFile(file, config.root);
          }
        })
        .on('unlink', async (file) => {
          if (file.startsWith(pagesDir)) {
            await removeFile(file, config.root);
          }
        });
    },
  };
}

import path from 'node:path';
import type { PluginOption, ResolvedConfig } from 'vite';
import { generate, removeFile, updateFile } from '@/plugin/generator';

export interface Options {
  pagesDir?: string;
}

export function cityGasRouter(options: Options = {}): PluginOption {
  let config: ResolvedConfig;

  return {
    name: 'city-gas-router',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async buildStart() {
      const pagesDir = path.resolve(
        config.root,
        options.pagesDir || 'src/pages',
      );

      // 初回は全スキャンして生成
      await generate(config.root, pagesDir);
    },
    configureServer(server) {
      const pagesDir = path.resolve(
        config.root,
        options.pagesDir || 'src/pages',
      );

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

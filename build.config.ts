import * as path from 'node:path';
import { defineBuildConfig } from 'unbuild';
export default defineBuildConfig({
  name: 'city-gas',
  outDir: 'dist',
  declaration: 'compatible',
  entries: [
    'src/index.ts',
    {
      input: 'src/plugin/index.ts',
      name: 'plugin',
    },
    { input: 'src/adapters/react/index', name: 'react' },
    { input: 'src/adapters/vue/index', name: 'vue' },
  ],
  clean: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: false,
    alias: {
      entries: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, '.'),
      },
    },
    esbuild: {
      jsx: 'automatic',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    },
  },
  externals: [
    'vite',
    'fast-glob',
    'ts-morph',
    'react',
    'react-dom',
    'vue',
    '@vue/compiler-sfc',
  ],
});

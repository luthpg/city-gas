import { defineBuildConfig } from 'unbuild';
export default defineBuildConfig({
  name: 'city-gas',
  outDir: 'dist',
  declaration: 'compatible',
  entries: ['src/index.ts'],
  clean: true,
  rollup: {
    emitCJS: true,
  },
});

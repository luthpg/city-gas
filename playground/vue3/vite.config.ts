import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { cityGasRouter } from '../../dist/plugin.mjs';

export default defineConfig({
  plugins: [
    vue(),
    cityGasRouter(), // auto-generate router types
  ],
  resolve: {
    alias: {
      '@ciderjs/city-gas': path.resolve(__dirname, '../../dist'),
    },
  },
});

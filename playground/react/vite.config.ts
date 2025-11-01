import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { cityGasRouter } from '../../dist/plugin.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cityGasRouter()],
  resolve: {
    alias: {
      '@ciderjs/city-gas': path.resolve(__dirname, '../../dist'),
    },
  },
});

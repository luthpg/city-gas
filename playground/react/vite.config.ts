import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cityGasRouter } from '../../dist/plugin.mjs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cityGasRouter()],
  resolve: {
    alias: {
      '@ciderjs/city-gas': path.resolve(__dirname, '../../dist'),
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cityGasRouter } from '../src/plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cityGasRouter()],
  resolve: {
    alias: {
      'city-gas': '../../src',
    },
  },
});

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { cityGasRouter } from "../../src/plugin";
import path from "path";

export default defineConfig({
  plugins: [
    vue(),
    cityGasRouter(), // auto-generate router types
  ],
  resolve: {
    alias: {
      '@ciderjs/city-gas/vue': path.resolve(__dirname, '../../src/adapters/vue'),
      '@ciderjs/city-gas': path.resolve(__dirname, '../../src'),
    },
  },
});

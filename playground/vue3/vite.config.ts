import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { cityGasRouter } from "../../dist/plugin.mjs";
import path from "path";

export default defineConfig({
  plugins: [
    vue(),
    cityGasRouter(), // auto-generate router types
  ],
  resolve: {
    alias: {
      'city-gas': path.resolve(__dirname, '../../dist'),
    },
  },
});

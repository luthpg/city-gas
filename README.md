# @ciderjs/city-gas

[![README-ja](https://img.shields.io/badge/日本語-blue?logo=ReadMe)](./README.ja.md)
<!-- [![Test Coverage](https://img.shields.io/badge/test%20coverage-95.1%25-brightgreen)](https://github.com/luthpg/city-gas) -->
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/city-gas.svg)](https://www.npmjs.com/package/@ciderjs/city-gas)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/city-gas.svg)](https://github.com/luthpg/city-gas/issues)

## 🌐 Overview

`city-gas` is a type-safe router for React and Vue 3 applications that works both in **Google Apps Script (GAS)** and **browser environments**.  
It features **file-based routing**, a **flexible params DSL**, and a **Vite plugin** that auto-generates TypeScript types for safe navigation.

---

## ✨ Features

- **File-based routing** (`src/pages/` → routes)  
- **Flexible params DSL** (string, number, boolean, enum, array, object, optional)  
- **Type-safe navigation** (`router.navigate("page", params)`)  
- **Environment adapters** (GAS / Browser)  
- **Vite plugin** generates `.d.ts` and route maps automatically  

---

## 📦 Installation

```bash
npm install city-gas
# or
pnpm add city-gas
```

---

## 🔌 Vite Plugin

`city-gas` provides a Vite plugin that automatically scans `src/pages/` and generates:

- `.generated/router.d.ts` → `RouteNames` and `RouteParams` types  
- `.generated/routes.ts` → route name ↔ component map  

### Usage (React)

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cityGasRouter } from "city-gas/plugin";

export default defineConfig({
  plugins: [
    react(),
    cityGasRouter(), // enable city-gas auto type generation
  ],
});
```

### Usage (Vue 3)

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { cityGasRouter } from "city-gas/plugin";

export default defineConfig({
  plugins: [
    vue(),
    cityGasRouter(), // enable city-gas auto type generation
  ],
});
```

The plugin will watch `src/pages/**/*.tsx` (React) or `src/pages/**/*.vue` (Vue) and regenerate types on file changes.

---

## 📜 License

MIT

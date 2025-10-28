# @ciderjs/city-gas

[![README-en](https://img.shields.io/badge/English-blue?logo=ReadMe)](./README.md)
<!-- [![Test Coverage](https://img.shields.io/badge/test%20coverage-95.1%25-brightgreen)](https://github.com/luthpg/city-gas) -->
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/city-gas.svg)](https://www.npmjs.com/package/@ciderjs/city-gas)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/city-gas.svg)](https://github.com/luthpg/city-gas/issues)

## 🌐 概要

`city-gas` は **Google Apps Script (GAS)** と **ブラウザ環境**の両方で動作する、React / Vue 3 向けの型安全なルーターです。  
**ファイルベースルーティング**、**柔軟な params DSL**、そして **Vite プラグインによる型自動生成**を特徴としています。

---

## ✨ 特徴

- **ファイルベースルーティング** (`src/pages/` → ルート)  
- **柔軟な params DSL** (string, number, boolean, enum, array, object, optional)  
- **型安全なナビゲーション** (`router.navigate("page", params)`)  
- **環境アダプター** (GAS / Browser)  
- **Vite プラグイン** による `.d.ts` とルートマップの自動生成  

---

## 📦 インストール

```bash
npm install @ciderjs/city-gas
# または
pnpm add @ciderjs/city-gas
```

---

## 🔌 Vite プラグイン

`city-gas` には Vite プラグインが付属しており、`src/pages/` を自動的に探索して以下を生成します:

- `.generated/router.d.ts` → `RouteNames` と `RouteParams` の型定義  
- `.generated/routes.ts` → ルート名とコンポーネントのマッピング  

### React の場合

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cityGasRouter } from "@ciderjs/city-gas/plugin";

export default defineConfig({
  plugins: [
    react(),
    cityGasRouter(), // city-gas の型自動生成を有効化
  ],
});
```

### Vue 3 の場合

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { cityGasRouter } from "@ciderjs/city-gas/plugin";

export default defineConfig({
  plugins: [
    vue(),
    cityGasRouter(), // city-gas の型自動生成を有効化
  ],
});
```

このプラグインは `src/pages/**/*.tsx` (React) または `src/pages/**/*.vue` (Vue) を監視し、ファイル変更時に型を再生成します。

---

## 🚀 使用方法

### React

```tsx
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter } from '@ciderjs/city-gas';
import { RouterProvider, RouterOutlet, useNavigate } from '@ciderjs/city-gas/react';
import { pages } from './generated/routes';

const router = createRouter(pages);

const Navigation = () => {
  const navigate = useNavigate();
  return (
    <nav>
      <button onClick={() => navigate('/')}>Go to Home</button>
      <button onClick={() => navigate('/users/show', { userId: '123' })}>Go to Profile 123</button>
      <button onClick={() => navigate('/about')}>Go to About</button>
    </nav>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}>
      <h1>city-gas Playground (React)</h1>
      <Navigation />
      <hr />
      <RouterOutlet />
    </RouterProvider>
  </React.StrictMode>,
);
```

### Vue 3

```ts
// main.ts
import { createApp } from 'vue';
import { createRouter } from '@ciderjs/city-gas';
import { createCityGasVuePlugin, RouterOutlet, useRouter } from '@ciderjs/city-gas/vue';
import { pages } from './generated/routes';
import App from './App.vue';

const router = createRouter(pages);
const cityGasVuePlugin = createCityGasVuePlugin(router);

const app = createApp(App);
app.use(cityGasVuePlugin);

// コンポーネント内での使用例:
// const router = useRouter();
// router.navigate('/');

app.mount('#app');
```

---

## 📜 ライセンス

MIT

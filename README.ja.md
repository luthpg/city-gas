# @ciderjs/city-gas

[![README-en](https://img.shields.io/badge/English-blue?logo=ReadMe)](./README.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/city-gas.svg)](https://www.npmjs.com/package/@ciderjs/city-gas)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/city-gas.svg)](https://github.com/luthpg/city-gas/issues)

## 🌐 概要

`city-gas` は **Google Apps Script (GAS)** と **ブラウザ環境**の両方で動作する、React / Vue 3 向けの型安全なルーターです。  
**ファイルベースルーティング**、**柔軟な params DSL**、そして **Vite プラグインによる型自動生成**を特徴としています。

---

## ✨ 特徴

- **ファイルベースルーティング** (`src/pages/` → ルート)  
- **ネストされたルート (レイアウト機能)** (`_layout`, `_root`, `_404`)
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

## 🚀 使い方

`city-gas` を使うと、ファイル構造がそのままアプリケーションのルーティングとレイアウトになります。

### 1. プロジェクト構成例

まず、`src/pages` ディレクトリにページとレイアウトを作成します。

```tree
src/
└── pages/
    ├── _root.tsx         # 全体を囲むルートレイアウト
    ├── _layout.tsx       # 直下とサブディレクトリに適用されるレイアウト
    ├── index.tsx         # ホームページ (ルート: /)
    └── users/
        ├── _layout.tsx   # /users/* にのみ適用されるネストされたレイアウト
        └── show.tsx      # ユーザー詳細ページ (ルート: /users/show)
```

### 2. ページのパラメータ定義 (DSL)

各ページコンポーネントでは、`params` という名前の定数を `export` することで、そのページが受け取るパラメータの型を定義できます。Viteプラグインはこれを自動的に検出し、型安全な `navigate` 関数や `useParams` フックを生成します。

#### React (`.tsx`)

通常の `named export` を使って `params` をエクスポートします。

```tsx
// src/pages/users/show.tsx
import React from 'react';

// パラメータの型定義
export const params = {
  userId: 'string',
  tab: { type: 'enum', values: ['profile', 'settings'], optional: true },
};

// コンポーネント内で useParams フックを使ってパラメータを受け取る
import { useParams } from '@ciderjs/city-gas/react';

export default function UserShowPage() {
  const { userId, tab } = useParams<'/users/show'>();
  return (
    <div>
      <h2>User: {userId}</h2>
      <p>Tab: {tab ?? 'profile'}</p>
    </div>
  );
}
```

#### Vue (`.vue`)

VueのSFCでは、`<script setup>` とは別に、通常の `<script>` タグを併用して `params` をエクスポートします。

```vue
<!-- src/pages/users/show.vue -->
<template>
  <div>
    <h2>User: {{ userId }}</h2>
    <p>Tab: {{ tab ?? 'profile' }}</p>
  </div>
</template>

<!-- Composition API はこちらに記述 -->
<script setup lang="ts">
import { useParams } from '@ciderjs/city-gas/vue';

const { userId, tab } = useParams<'/users/show'>();
</script>

<!-- params のエクスポート用に別の script タグを用意 -->
<script lang="ts">
export const params = {
  userId: 'string',
  tab: { type: 'enum', values: ['profile', 'settings'], optional: true },
};
</script>
```

### 3. レイアウトの実装例

#### React

**`src/pages/_root.tsx` (ルートレイアウト)**
アプリケーション全体で共通のヘッダーやスタイル、Context Providerなどを配置します。

```tsx
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="root-layout" style={{ border: '2px solid blue', padding: '1rem' }}>
      <h2>ルートレイアウト (_root)</h2>
      {children}
    </div>
  );
}
```

**`src/pages/users/_layout.tsx` (ネストされたレイアウト)**
特定のセクション（この場合は `/users` 以下）にのみ適用されるレイアウトです。

```tsx
import React from 'react';

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="users-layout" style={{ border: '2px solid green', padding: '1rem' }}>
      <h3>Users セクションレイアウト (users/_layout)</h3>
      {children}
    </div>
  );
}
```

#### Vue

**`src/pages/_root.vue` (ルートレイアウト)**

```vue
<template>
  <div id="root-layout" style="border: 2px solid blue; padding: 1rem;">
    <h2>ルートレイアウト (_root)</h2>
    <slot></slot>
  </div>
</template>
```

**`src/pages/users/_layout.vue` (ネストされたレイアウト)**

```vue
<template>
  <div id="users-layout" style="border: 2px solid green; padding: 1rem;">
    <h3>Users セクションレイアウト (users/_layout)</h3>
    <slot></slot>
  </div>
</template>
```

### 4. ルーターの初期化とAppの実装 (React)

アプリケーションのエントリーポイント（`main.tsx`）でルーターをセットアップし、`App.tsx` で `RouterOutlet` を使ってページを描画します。

**`src/main.tsx`**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter } from '@ciderjs/city-gas';
import { RouterProvider } from '@ciderjs/city-gas/react';
import { pages, specialPages } from './generated/routes';
import App from './App';

// ルーターインスタンスを作成
const router = createRouter(pages, { specialPages });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}>
      <App />
    </RouterProvider>
  </React.StrictMode>,
);
```

**`src/App.tsx`**
```tsx
import React from 'react';
import { RouterOutlet, useNavigate } from '@ciderjs/city-gas/react';

const Navigation = () => {
  const navigate = useNavigate();
  return (
    <nav>
      <button onClick={() => navigate('/')}>Home</button>
      <button onClick={() => navigate('/users/show', { userId: '123' })}>User 123</button>
    </nav>
  );
};

function App() {
  return (
    <div>
      <h1>city-gas Playground (React)</h1>
      <Navigation />
      <hr />
      <RouterOutlet />
    </div>
  );
}

export default App;
```

### 5. Vue 3での利用

Vueでの基本的なセットアップは以下の通りです。

```ts
// main.ts
import { createApp } from 'vue';
import { createRouter } from '@ciderjs/city-gas';
import { createCityGasVuePlugin } from '@ciderjs/city-gas/vue';
import { pages, specialPages } from './generated/routes';
import App from './App.vue';

const router = createRouter(pages, { specialPages });
const cityGasVuePlugin = createCityGasVuePlugin(router);

const app = createApp(App);
app.use(cityGasVuePlugin);
app.mount('#app');
```

---

## 📜 ライセンス

MIT

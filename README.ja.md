# @ciderjs/city-gas

[![README-en](https://img.shields.io/badge/English-blue?logo=ReadMe)](README.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/city-gas.svg)](https://www.npmjs.com/package/@ciderjs/city-gas)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/city-gas.svg)](https://github.com/luthpg/city-gas/issues)

## 🌐 概要

`city-gas` は **Google Apps Script (GAS)** と **ブラウザ環境**の両方で動作する、React / Vue 3 向けの型安全なルーターです。
**ファイルベースルーティング**、**柔軟な params DSL**、そして **Vite プラグインによる型自動生成**を特徴としています。

---

## 📦 インストール

```bash
npm install @ciderjs/city-gas
# または
pnpm add @ciderjs/city-gas
```

---

## 🔥 コア機能

`city-gas` はフレームワークに依存しないコア機能を提供します。

### 1. ファイルベースルーティング

`src/pages` ディレクトリの構造が自動的にルート定義に変換されます。

- `src/pages/index.tsx` → `/`
- `src/pages/about.vue` → `/about`
- `src/pages/users/show.tsx` → `/users/show`
- `src/pages/users/[id].tsx` → `/users/[id]` (動的ルート)

### 2. ネストされたルート (レイアウト)

特定のファイル名は予約されており、レイアウトコンポーネントとして機能します。

- `_root.tsx` / `_root.vue`: アプリケーション全体を囲むルートレイアウト。
- `_layout.tsx` / `_layout.vue`: 同じディレクトリとそのサブディレクトリ内の子ルートに共通のレイアウトを提供します。
- `_404.tsx` / `_404.vue`: マッチするルートが見つからなかった場合に表示されるフォールバックページ。

#### プロジェクト構成例

```tree
src/
└── pages/
    ├── _root.tsx         # 全体を囲むルートレイアウト
    ├── _layout.tsx       # 直下とサブディレクトリに適用されるレイアウト
    ├── index.tsx         # ホームページ (ルート: /)
    └── users/
        ├── _layout.tsx   # /users/* にのみ適用されるネストされたレイアウト
        ├── [id].tsx      # ユーザー詳細ページ (ルート: /users/[id])
        └── index.tsx     # ユーザー一覧ページ (ルート: /users)
```

### 3. 動的ルート (Dynamic Routes)

ファイル名を `[id].tsx` のようにブラケットで囲むことで、動的ルートを定義できます。
ブラケット内のパラメータ名（例: `id`）は `useParams` で取得できます。

- `src/pages/users/[id].tsx` は `/users/123`, `/users/abc` などにマッチします。
- `src/pages/posts/[slug].vue` は `/posts/my-first-post` などにマッチします。

### 3. 型安全なパラメータ (DSL)

各ページでは `params` 定数を `export` することで、そのページが受け取るパラメータの型を定義できます。

- サポートする型: `string`, `number`, `boolean`, `enum`, `array`, `object`
- `?` を付けることでオプショナルな型を表現できます (例: `string?`)

Viteプラグインはこれを検出し、型安全な `navigate` 関数や `useParams` フック/Composableを生成します。

#### パラメータ定義の例

```typescript
// src/pages/users/[id].tsx
export const params = {
  // id: 'string', // パスパラメータは自動的に必須の「string」型で定義されるので記載不要
  tab: { type: 'enum', values: ['profile', 'settings'], optional: true }, // オプショナル
};
```

### 4. Vite プラグインによる型生成

`vite.config.ts` にプラグインを追加するだけで、`src/pages` ディレクトリを監視し、ルートと型の定義を自動生成します。

- `.generated/router.d.ts`: `RouteNames` と `RouteParams` の型定義
- `.generated/routes.ts`: ルート名とコンポーネントのマッピング

> [!NOTE]
> プラグインはパフォーマンス最適化のため、ファイルの更新時刻 (`mtime`) に基づく内部キャッシュを使用し、不要な再生成を回避します。

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // or vue()
import { cityGasRouter } from "@ciderjs/city-gas/plugin";

export default defineConfig({
  plugins: [
    react(), // or vue()
    cityGasRouter(),
  ],
});
```

---

## 🚀 React での使い方

### 1. 初期化

エントリーポイント (`main.tsx`) でルーターをセットアップし、`RouterProvider` でアプリケーションをラップします。

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter } from '@ciderjs/city-gas';
import { RouterProvider } from '@ciderjs/city-gas/react';
import { pages, specialPages, dynamicRoutes } from './generated/routes';

// ルーターインスタンスを作成
const router = createRouter(pages, { specialPages, dynamicRoutes });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

### 2. Hooks

`city-gas` は型安全な操作のためのカスタムフックを提供します。

#### `useParams`

現在のページのパラメータを型安全に取得します。

```tsx
// src/pages/users/[id].tsx
import { useParams } from '@ciderjs/city-gas/react';

export const params = {
  tab: { type: 'enum', values: ['profile', 'settings'], optional: true },
};

export default function UserDetail() {
  // ルート名を引数として渡すことで、厳密な型推論が可能になります
  const { id, tab } = useParams('/users/[id]');
  
  return (
    <div>
      <h2>User: {id}</h2>
      <p>Tab: {tab ?? 'profile'}</p>
    </div>
  );
}
```

#### `useNavigate`

型チェック付きでページ遷移を実行します。

```tsx
// src/components/SomeComponent.tsx
import { useNavigate } from '@ciderjs/city-gas/react';

const MyComponent = () => {
  const navigate = useNavigate();
  return (
    <nav>
      <button onClick={() => navigate('/')}>Home</button>
      {/* パラメータも型安全 */}
      <button onClick={() => navigate('/users/[id]', { id: '123', tab: 'settings' })}>
        User 123
      </button>
    </nav>
  );
};
```

---

## 🚀 Vue での使い方

### 1. 初期化

エントリーポイント (`main.ts`) でルータープラグインをセットアップし、`RouterOutlet` をマウントします。

```ts
// src/main.ts
import { createRouter } from '@ciderjs/city-gas';
import { createRouterPlugin, RouterOutlet } from '@ciderjs/city-gas/vue';
import { createApp } from 'vue';
import { pages, specialPages, dynamicRoutes } from './generated/routes';

const router = createRouter(pages, { specialPages, dynamicRoutes });
createApp(RouterOutlet).use(createRouterPlugin(router)).mount('#root');
```

### 2. Composables

Vue 3 の Composition API で利用できる Composable を提供します。

#### `useParams`

現在のページのパラメータを型安全に取得します。

```vue
<!-- src/pages/users/[id].vue -->
<template>
  <div>
    <h2>User: {{ id }}</h2>
    <p>Tab: {{ tab ?? 'profile' }}</p>
  </div>
</template>

<script setup lang="ts">
import { useParams } from '@ciderjs/city-gas/vue';

// ルート名を引数として渡すことで、厳密な型推論が可能になります
const { id, tab } = useParams('/users/[id]');
</script>

<!-- params のエクスポート用に別の script タグを用意 -->
<script lang="ts">
export const params = {
  tab: { type: 'enum', values: ['profile', 'settings'], optional: true },
};
</script>
```

#### `useNavigate`

型チェック付きでページ遷移を実行します。

```vue
<!-- src/components/SomeComponent.vue -->
<template>
  <nav>
    <button @click="() => navigate('/')">Home</button>
    <!-- パラメータも型安全 -->
    <button @click="() => navigate('/users/[id]', { id: '123', tab: 'settings' })">
      User 123
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useNavigate } from '@ciderjs/city-gas/vue';
const navigate = useNavigate();
</script>
```

---

## 📜 ライセンス

MIT

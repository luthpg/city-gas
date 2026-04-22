# @ciderjs/city-gas

[![README-en](https://img.shields.io/badge/English-blue?logo=ReadMe)](README.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/city-gas.svg)](https://www.npmjs.com/package/@ciderjs/city-gas)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/city-gas.svg)](https://github.com/luthpg/city-gas/issues)

**Google Apps Script (GAS)** と **モダンブラウザ** の両方で動作する、React & Vue 3 向けの型安全なファイルベースルーターです。

## ✨ 特徴

* 🚀 **Universal**: ブラウザ (`window.history`) と GAS (`google.script.history`) の両環境で動作。環境を自動判定してアダプタを切り替えます。
* 📂 **File-based Routing**: `src/pages` ディレクトリの構造に基づいてルートを自動生成。
* 🛡️ **Type Safety**: Zod スキーマでクエリパラメータを定義し、パスパラメータとクエリの両方に対して厳密な型チェックとバリデーションを提供。
* 🤖 **Auto Generation**: Vite プラグインがルート定義と型定義 (`.d.ts`) を自動生成。`Maps` や `useParams` で強力な補完が効きます。
* 🧩 **Nested Layouts**: `_layout`, `_root` などの特殊ファイルによる柔軟なレイアウトシステム。

---

## 📦 インストール

`react` / `vue` および `vite`, `zod` が必要です。

```bash
# npm
npm install @ciderjs/city-gas zod

# pnpm
pnpm add @ciderjs/city-gas zod

# yarn
yarn add @ciderjs/city-gas zod
```

---

## 🚀 クイックスタート

### 1. Vite 設定

`vite.config.ts` にプラグインを追加します。これがファイル監視と型生成を行います。

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { cityGasRouter } from '@ciderjs/city-gas/plugin';
// フレームワークに合わせて選択
import react from '@vitejs/plugin-react';
// import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    react(), // or vue()
    cityGasRouter({
      pagesDir: 'src/pages', // デフォルトは 'src/pages'
    }),
  ],
});
```

### 2. アプリケーションのエントリーポイント設定

#### React の場合 (`src/main.tsx`)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter } from '@ciderjs/city-gas';
import { RouterProvider } from '@ciderjs/city-gas/react';
// 自動生成されたルート定義をインポート
import { pages, specialPages, dynamicRoutes } from './generated/routes';

// ルーターの初期化
const router = createRouter(pages, { specialPages, dynamicRoutes });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

#### Vue の場合 (`src/main.ts`)

```ts
import { createApp } from 'vue';
import { createRouter } from '@ciderjs/city-gas';
import { createRouterPlugin, RouterOutlet } from '@ciderjs/city-gas/vue';
import { pages, specialPages, dynamicRoutes } from './generated/routes';

const router = createRouter(pages, { specialPages, dynamicRoutes });
const app = createApp(RouterOutlet);

app.use(createRouterPlugin(router));
app.mount('#app');
```

---

## 📖 ルーティングガイド

### ディレクトリ構造とマッピング

`src/pages` (設定可能) 以下のファイルがルートになります。

```text
src/pages/
├── index.tsx           -> "/"
├── about.tsx           -> "/about"
├── users/
│   ├── index.tsx       -> "/users"
│   └── show.tsx        -> "/users/show"
└── posts/
    └── [postId].tsx    -> "/posts/[postId]" (動的ルート)
```

### ページコンポーネントの基本

ページコンポーネントは `export default` で定義します。

**React の例 (`src/pages/index.tsx`)**

```tsx
import React from 'react';

export default function HomePage() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to the home page!</p>
    </div>
  );
}
```

**Vue の例 (`src/pages/index.vue`)**

```vue
<template>
  <div>
    <h1>Home</h1>
    <p>Welcome to the home page!</p>
  </div>
</template>
```

### 動的ルート (Dynamic Routes)

ファイル名を `[paramName].tsx` とすることで、パスパラメータを取得できます。

```tsx
// src/pages/users/[userId].tsx
import { useParams } from '@ciderjs/city-gas/react';

export default function UserPage() {
  // 型安全: userId は string として推論されます
  const { userId } = useParams('/users/[userId]');
  return <div>User ID: {userId}</div>;
}
```

### ネストされたレイアウト

特殊なファイル名を使用することで、階層的なレイアウトを実現できます。

* **`_root.tsx`**: アプリケーション全体をラップする最上位レイアウト。
* **`_layout.tsx`**: 配置されたディレクトリ以下の全てのルートに適用されるレイアウト。
* **`_404.tsx`**: 定義されていないルートにアクセスした際に表示されるコンポーネント。
* **`_loading.tsx`**: ページ遷移中や初期化中に表示されるコンポーネント。

**例: `src/pages/settings/_layout.tsx`**

```tsx
// React Example
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="settings-wrapper">
      <aside>Settings Sidebar</aside>
      <main>{children}</main>
    </div>
  );
}
```

---

## 🛡️ パラメータの定義とバリデーション (Zod)

各ページファイルで `schema` をエクスポートすると、そのページが受け取るクエリパラメータを定義できます。
定義されたスキーマは、ランタイムでのバリデーションと、静的な型生成の両方に使用されます。

### React の例

```tsx
// src/pages/search.tsx
import { z } from 'zod';
import { useParams } from '@ciderjs/city-gas/react';

// スキーマ定義
export const schema = z.object({
  q: z.string(),
  page: z.coerce.number().optional(), // URL文字列を数値に変換
  sort: z.enum(['date', 'relevance']).optional(),
});

export default function SearchPage() {
  // params は { q: string; page?: number; sort?: "date" | "relevance" } と型推論される
  const params = useParams('/search');

  return (
    <div>
      <h1>Search: {params.q}</h1>
      <p>Page: {params.page ?? 1}</p>
    </div>
  );
}
```

### Vue の例

> [!NOTE]
> **Vue ユーザー向けの注意**
> `<script setup>` 内では `export` ができないため、`schema` の定義は必ず通常の `<script>` ブロックを別途用意して行ってください。

```vue
<script setup lang="ts">
import { useParams } from '@ciderjs/city-gas/vue';

// setup 内でref化されたパラメータを利用
const params = useParams('/search');
</script>

<script lang="ts">
import { z } from 'zod';

export const schema = z.object({
  q: z.string(),
  page: z.coerce.number().optional(),
  sort: z.enum(['date', 'relevance']).optional(),
});
</script>

<template>
  <div>
    <h1>Search: {{ params.q }}</h1>
    <p>Page: {{ params.page ?? 1 }}</p>
  </div>
</template>
```

> [!CAUTION]
> **GAS環境でのURL長制限について**
> Google Apps Script 環境では URL の長さに制限（約 2KB 程度）があります。
> 本ライブラリはオブジェクトパラメータを JSON シリアライズして URL に含めるため、大きなデータを `params` に渡すとエラーの原因になります。
> 大規模なデータを受け渡す場合は、`PropertiesService` や `CacheService`、あるいはグローバルな状態管理ライブラリ（Pinia, Recoil等）の利用を検討してください。

> [!WARNING]
> バリデーションに失敗した場合、ルーターは自動的に `_404` ページへ遷移します。

---

## 🧭 ナビゲーション

`useNavigate` フックを使用して、型安全にページ遷移を行います。

### React

```tsx
import { useNavigate } from '@ciderjs/city-gas/react';

const Component = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    // 第1引数: ルート名（補完あり）
    // 第2引数: パラメータ（schemaに基づき型チェックあり）
    navigate('/search/[id]', { id: '1', q: 'city-gas', page: 1 });
    
    // オプションで replace も可能
    // navigate('/', {}, { replace: true });
  };

  return <button onClick={handleClick}>Search</button>;
};
```

### Vue

```vue
<script setup lang="ts">
import { useNavigate } from '@ciderjs/city-gas/vue';

const navigate = useNavigate();

const handleClick = () => {
  navigate('/search', { q: 'city-gas', page: 1 });
};
</script>
```

---

## ⚙️ API リファレンス

### `createRouter(pages, options)`

ルーターインスタンスを生成します。

* `pages`: `.generated/routes.ts` からインポートしたページ定義。
* `options`:
  * `specialPages`: `_root`, `_layout` などの特殊ページ定義。
  * `dynamicRoutes`: 動的ルートのマッチング用定義。
  * `defaultRouteName`: デフォルトのルート（通常は `'/'`）。

### `router` インスタンス

* `router.navigate(name, params, options)`: 指定したルートへ遷移します。
* `router.subscribe(listener)`: ルート変更を監視します。
* `router.getCurrentRoute()`: 現在のルート情報を取得します。
* `router.beforeEach(guard)`: ナビゲーションガードを登録します。

#### ナビゲーションガード

```ts
router.beforeEach((to, from, next) => {
  if (to.name === '/admin' && !isAdmin) {
    // ログインページへリダイレクト
    next('/login');
  } else {
    // 遷移を許可
    next();
    // もしくは next(false) でキャンセル
  }
});
```

### Hooks / Composables

* `useParams(routeName)`: 現在のルートのパラメータを取得します。引数にルート名を渡すと型が絞り込まれます。
* `useNavigate()`: ナビゲーション関数を返します。
* `useRoute()`: 現在のルート名とパラメータを含むオブジェクト全体を返します。

---

## ⚠️ 既知の制限事項

### スキーマ定義

パラメータの `schema` エクスポートは、ページファイル内で **インライン** で定義する必要があります。
Vite プラグインは静的解析 (AST) を使用して型を生成するため、外部ファイルからのスキーマのインポートはサポートされていません。

**❌ 非サポート:**

```ts
// src/pages/users.tsx
import { userSchema } from '@/schemas';
export const schema = userSchema; // ジェネレータが型を推論できません
```

**✅ サポート:**

```ts
// src/pages/users.tsx
import { z } from 'zod';
export const schema = z.object({
  id: z.string(),
});
```

### パラメータの型

パスパラメータ (例: `[id]`) は、デフォルトでは文字列として扱われます。
スキーマ内でパスパラメータを別の型 (例: `z.number()`) として定義する場合は、URL からの生の値は文字列であるため、`z.coerce.number()` などの変換を使用してください。

### グローバルな副作用とクリーンアップ

本ライブラリは、静的解析と型生成のためにルーティング対象の全ファイルを起動時にインポート（評価）します。そのため、以下の点に注意してください。

* **トップレベルでの副作用を避ける**: コンポーネント関数の外側（ファイルのトップレベル）に `console.log` や API 通信、イベントリスナーの登録を書くと、そのページを開いていなくてもアプリ起動時に即座に実行されてしまいます。初期化処理は必ずコンポーネント内の `useEffect` (React) や `onMounted` (Vue) などで行ってください。
* **クリーンアップの徹底**: SPA の特性上、ページを遷移しても JS の状態は保持されます。`useEffect` や `onMounted` で `setInterval` やイベントリスナーを登録した場合は、必ずクリーンアップ関数を返し、意図しない裏側での動作（メモリリークや非対象ページでの発火）を防いでください。

---

## 🤝 コントリビュートガイド

`city-gas` の開発に参加していただきありがとうございます！

### 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/luthpg/city-gas.git
cd city-gas

# 依存関係のインストール (pnpm を使用してください)
pnpm install

# ビルド
pnpm build
```

### プレイグラウンドでの動作確認

リポジトリには React と Vue の動作確認用プレイグラウンドが含まれています。

```bash
# React 版の起動
pnpm run dev:r

# Vue 版の起動
pnpm run dev:v
```

### テストの実行

```bash
# 全テストの実行
pnpm test

# 型チェック
pnpm run check
```

### Pull Request のガイドライン

1. 機能追加やバグ修正ごとにブランチを作成してください。
2. 変更内容に対応するテストを追加してください。
3. コミットメッセージは明確に記述してください。
4. PRを作成する前に `pnpm test` と `pnpm run check` がパスすることを確認してください。

---

## 📝 ライセンス

MIT License

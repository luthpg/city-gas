# @ciderjs/city-gas

[![README-en](https://img.shields.io/badge/English-blue?logo=ReadMe)](README.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@ciderjs/city-gas.svg)](https://www.npmjs.com/package/@ciderjs/city-gas)
[![GitHub issues](https://img.shields.io/github/issues/luthpg/city-gas.svg)](https://github.com/luthpg/city-gas/issues)

**Google Apps Script (GAS)** と **モダンブラウザ** の両方で動作する、React & Vue 3 向けの型安全なファイルベースルーターです。

## ✨ 特徴

* 🚀 **Universal**: ブラウザ (`window.history`) と GAS (`google.script.history`) の両環境で動作。環境を自動判定してアダプタを切り替えます。
* 📂 **File-based Routing**: `src/pages` ディレクトリの構造に基づいてルートを自動生成。内部的には URL の `?page=...` クエリパラメータを利用して、GAS 環境の制約に対応した擬似的なパスルーティングを実現しています。
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

## 📖 共通ルーティングガイド

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

> [!NOTE]
> **同名ファイルと index の優先順位**
> `src/pages/users.tsx` と `src/pages/users/index.tsx` の両方が存在する場合、子ディレクトリの `index.tsx` (`/users`) が優先してルートとして登録されます。親階層の同名ファイルは無視されます。

### 動的ルート (Dynamic Routes) とパスパラメータ

ファイル名を `[paramName].tsx` とすることで、パスパラメータを取得できます。

> [!TIP]
> **パスパラメータのスキーマ定義**
> パスパラメータ（例：`[id]`）は、スキーマに記載しなくてもデフォルトで `z.string()` として扱われます。
> もし数値として扱いたい場合など、スキーマ内で明示的に定義（例: `id: z.coerce.number()`）した場合は、ユーザーの定義が優先されます。

### ネストされたレイアウト

特殊なファイル名を使用することで、階層的なレイアウトを実現できます。

* **`_root.tsx`**: アプリケーション全体をラップする最上位レイアウト。
* **`_layout.tsx`**: 配置されたディレクトリ以下の全てのルートに適用されるレイアウト。
* **`_404.tsx`**: 定義されていないルートにアクセスした際に表示されるコンポーネント。
* **`_loading.tsx`**: ページ遷移中や初期化中に表示されるコンポーネント。

---

## ⚛️ React ガイド

### 1. Vite 設定
```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { cityGasRouter } from '@ciderjs/city-gas/plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    cityGasRouter(),
  ],
});
```

### 2. エントリーポイント (`src/main.tsx`)
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter } from '@ciderjs/city-gas';
import { RouterProvider } from '@ciderjs/city-gas/react';
import { pages, specialPages, dynamicRoutes } from './generated/routes';

const router = createRouter(pages, { specialPages, dynamicRoutes });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

### 3. ページコンポーネントとスキーマ定義

ページコンポーネントは `export default` で定義します。
各ページファイルで `schema` をエクスポートすると、そのページが受け取るパラメータを定義できます。

```tsx
// src/pages/search/[categoryId].tsx
import { z } from 'zod';
import { useParams, useNavigate } from '@ciderjs/city-gas/react';

// スキーマ定義
export const schema = z.object({
  q: z.string(),
  pageIndex: z.coerce.number().optional(), // 'page' は予約語のため使用できません
});

export default function SearchPage() {
  // パスパラメータ (categoryId) とクエリパラメータ (q, pageIndex) が型推論されます
  const params = useParams('/search/[categoryId]');
  const navigate = useNavigate();

  return (
    <div>
      <h1>Category: {params.categoryId}</h1>
      <p>Search: {params.q}</p>
      <button onClick={() => navigate('/search/[categoryId]', { categoryId: '1', q: 'react' })}>
        検索
      </button>
    </div>
  );
}
```

---

## 💚 Vue ガイド

### 1. Vite 設定
```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { cityGasRouter } from '@ciderjs/city-gas/plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue(),
    cityGasRouter(),
  ],
});
```

### 2. エントリーポイント (`src/main.ts`)
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

### 3. ページコンポーネントとスキーマ定義

Vueの場合、`<script setup>` 内では型をエクスポートできないため、`schema` の定義は通常の `<script>` ブロックで行います。

```vue
<script setup lang="ts">
import { useParams, useNavigate } from '@ciderjs/city-gas/vue';

const params = useParams('/search/[categoryId]');
const navigate = useNavigate();

const handleClick = () => {
  navigate('/search/[categoryId]', { categoryId: '1', q: 'vue' });
};
</script>

<script lang="ts">
import { z } from 'zod';

export const schema = z.object({
  q: z.string(),
  pageIndex: z.coerce.number().optional(), // 'page' は予約語のため使用できません
});
</script>

<template>
  <div>
    <h1>Category: {{ params.categoryId }}</h1>
    <p>Search: {{ params.q }}</p>
    <button @click="handleClick">検索</button>
  </div>
</template>
```

---

## ⚙️ API リファレンス (共通)

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
パラメータの `schema` は、ページコンポーネントと **同一ファイル内** で定義・エクスポートする必要があります。
Vite プラグインは静的解析 (AST) を使用して型を生成するため、外部ファイルからのスキーマのインポートはサポートされていません。

### 予約語 `page` について
本ライブラリは、ファイルベースのルートを解決するために、内部でURLの `?page=...` クエリを利用しています。
そのため、スキーマ定義の中で `page` というキー名をパラメータとして使用することはできません。ページネーションなどが必要な場合は、`pageIndex` などの別の名前を使用してください。

### GAS環境でのURL長制限
Google Apps Script 環境では URL の長さに制限（約 2KB 程度）があります。
本ライブラリはオブジェクトパラメータを JSON シリアライズして URL に含めるため、大きなデータを `params` に渡すとエラーの原因になります。
大規模なデータを受け渡す場合は、`PropertiesService` や `CacheService`、あるいはグローバルな状態管理ライブラリ（Pinia, Recoil等）の利用を検討してください。

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

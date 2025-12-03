# city-gas 要件定義書 (柔軟 params DSL・File-based Routing)

---

## 概要

**@ciderjs/city-gas** は、Google Apps Script (GAS) 環境とブラウザ環境の両方で動作する、**React および Vue** 向けの TypeScript 製ルーター。  
特徴は以下の通り:

- **ファイルベースルーティング**: `src/pages/` 以下のファイル構造をルートに変換
- **ネストされたルート (レイアウト機能)**: `_layout.tsx` による共通レイアウト、`_root.tsx` によるルート提示、`_404.tsx` による見つからないページのフォールバック
- ~~柔軟 params DSL~~ / **Zod対応**: ページごとに `export const schema = z.object({ ... })` を宣言し、Zod スキーマを利用して型定義とバリデーションを行う
- **型安全なパスパラメータ**: 動的ルートのパスパラメータも型付けされ、フックで取得可能
- **型安全な navigate**: `router.navigate("pageName", params)` が IDE 補完され、型エラーを防止
- **ナビゲーションガード**: 認証状態のチェックや、フォームの未保存データを警告するなど、ルート遷移を制御する仕組み
- **フレームワーク対応**: React Hooks と Vue Composables の両方を提供
- **環境抽象化**: GAS 環境では `google.script.url` / `google.script.history` を利用、ブラウザでは `window.location` / `window.history` を利用
- **Vite プラグイン**: ページ構造と params 定義から `RouteNames` と `RouteParams` を自動生成

---

## Goals

- React と Vue 向けの軽量ルーターを提供
- **エントリーポイントの簡素化**: `App.tsx`/`App.vue` といったラッパーコンポーネントを不要とし、`main` エントリーポイントでのセットアップを完結させる。
- 柔軟 DSL による型安全な params 定義
- GAS 環境に最適化されたクエリ駆動ルーティング (`?page=...` を使用。`page=index` やパラメータなしはルートとして解釈)
- Vite プラグインによる DX 向上 (型自動生成)
- Zod を利用した堅牢なバリデーション

---

## File-based Routing

`src/pages` 以下のファイル構造が、自動的にルート定義に変換されます。
`index` ファイル（`index.tsx` や `index.vue`）は、そのディレクトリのルートとして扱われます。

### ディレクトリ構造

```txt
src/pages/
  index.tsx       // ルートは '/'
  about.vue       // ルートは '/about'
  users/
    index.tsx     // ルートは '/users'
    show.tsx      // ルートは '/users/show'
    [userId].tsx  // ルートは 'users/[userId]'、userId は型付けされたパスパラメータ
```

### 自動生成される型

```ts: src/.generated/router.d.ts
// .generated/router.d.ts
export type RouteNames =
  | "/"
  | "/about"
  | "/users"
  | "/users/show";
  // | "users/[userId]";

export interface RouteParams {
  "/": {};
  "/about": {};
  "/users": {};
  "/users/show": { userId: string }; // (例: show.tsx が params を持つ場合)
  // "users/[userId]": { userId: string };
}
```

---

## Nested Routes

- `_layout.tsx` / `_layout.vue`: 子ルートに共通のレイアウトを提供。ネストされたルートの親として機能。
- `_root.tsx` / `_root.vue`: アプリケーションの最上位レイアウト。全てのルートに適用される。
- `_404.tsx` / `_404.vue`: マッチするルートが見つからなかった場合に表示されるフォールバックページ。

---

## Zod スキーマの仕様

Zod スキーマを使用してパラメータを定義します。

```tsx
// src/pages/users/show.tsx
import { z } from 'zod';

export const schema = z.object({
  userId: z.string(),
  page: z.coerce.number().optional(),
});

export default function UserShowPage({ userId }: { userId: string }) {
  return <div>User ID: {userId}</div>;
}
```

---

## Public API

### Core

- `createRouter<R, P>(pages, options)`: ルーターインスタンスを生成
- `router.beforeEach((to, from, next) => { ... })`: ナビゲーションガードを登録
- `options.onValidateError`: バリデーションエラー時のカスタムフック

### React

```ts: src/main.tsx
// src/main.tsx
import { RouterProvider } from "@ciderjs/city-gas/react";

// RouterProvider は children がなくても自動で RouterOutlet をレンダリングする
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

```tsx: src/pages/index.tsx
// src/pages/index.tsx
import { useNavigate, useParams, useRoute } from "@ciderjs/city-gas/react";

// 型安全なナビゲーション
const navigate = useNavigate();
navigate("users/show", { userId: "123" });

// パラメータ取得
const params = useParams();

// ルート情報全体
const route = useRoute();
```

### Vue

```ts: src/main.ts
import { createRouterPlugin, RouterOutlet } from "@ciderjs/city-gas/vue";

// main.ts
const app = createApp(RouterOutlet);
app.use(createRouterPlugin(router)).mount('#root');
```

```vue: src/components/Component.vue
import { useNavigate, useParams, useRoute } from "@ciderjs/city-gas/vue";

// Component.vue
const navigate = useNavigate();
navigate("users/show", { userId: "123" });

const params = useParams();
const route = useRoute();
```

---

## Navigation Guards

ナビゲーションガードは、ルート遷移の前後で処理を挟み込むための機能です。認証状態のチェック、ユーザー権限の確認、フォームの未保存データの警告などに利用できます。

```ts
router.beforeEach((to, from, next) => {
  // to: 遷移先のルート情報
  // from: 遷移元のルート情報
  // next: ナビゲーションを解決するための関数

  // 例: 認証されていない場合はログインページへリダイレクト
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next(); // ナビゲーションを続行
  }
});
```

---

## Vite プラグイン

### Responsibilities

- `src/pages/**/*.{tsx,vue}` を探索
- ファイル名からルート名を生成
- `index` ファイル（`test/index.tsx`）と通常ファイル（`test.tsx`）の競合を解決し、`index` を優先する
- `params` オブジェクトを解析し、必須/任意/enum/配列/ネストを型に変換
- `.generated/router.d.ts` と `.generated/routes.ts` を出力
- HMR 対応でファイル追加/削除/変更時に型を再生成
- HMR時のパフォーマンス最適化（ファイルI/O削減）:
  - 変更のないファイルのAST解析をスキップするため、ファイルキャッシュ（mtime, 解析結果）を導入する。
  - 生成される型定義やルートマップの内容が前回と同一の場合、ファイル書き込み（writeFileSync）をスキップする。

---

## Error handling

- 未定義のルート → `defaultRoute` にフォールバック
- GAS API 未定義 → ブラウザモードにフォールバック
- params 不一致 → TypeScript コンパイルエラー
- DSL が不正 → ビルドエラー
- ルート競合（`index` 優先）→ コンソールに警告 (warn) を出力

---

## ⚠️ 既知の制限事項 (Known Limitations)

### スキーマ定義

パラメータの `schema` エクスポートは、ページファイル内で **インライン** で定義する必要があります。
Vite プラグインは静的解析 (AST) を使用して型を生成するため、外部ファイルからのスキーマのインポートはサポートされていません。

### パラメータの型

パスパラメータ (例: `[id]`) は、デフォルトでは文字列として扱われます。
スキーマ内でパスパラメータを別の型 (例: `z.number()`) として定義する場合は、URL からの生の値は文字列であるため、`z.coerce.number()` などの変換を使用してください。

---

## Roadmap

- **v0.1.0:** 柔軟 params DSL (配列/ネスト対応) + 型生成 + navigate API
- **v0.2.0:** React/Vue サポート、Hooks と Composables の実装
- **v0.3.0:** 動的ルート `[id].tsx` 対応 (オプション機能)
- **v0.4.0:** Zod スキーマ対応 (DSL → Zod マッピング)
- **v1.0.0:** 安定版リリース

---

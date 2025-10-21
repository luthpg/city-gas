# city-gas 要件定義書 (柔軟 params DSL・File-based Routing)

---

## 概要

**@ciderjs/city-gas** は、Google Apps Script (GAS) 環境とブラウザ環境の両方で動作する、**React および Vue** 向けの TypeScript 製ルーター。  
特徴は以下の通り:

- **ファイルベースルーティング**: `src/pages/` 以下のファイル構造をルートに変換
- **柔軟 params DSL / Zod対応**: ページごとに `export const params = { ... }` を宣言し、必須/任意、enum、配列、ネストオブジェクトを表現可能
- **型安全な navigate**: `router.navigate("pageName", params)` が IDE 補完され、型エラーを防止
- **フレームワーク対応**: React Hooks と Vue Composables の両方を提供
- **環境抽象化**: GAS 環境では `google.script.url` / `google.script.history` を利用、ブラウザでは `window.location` / `window.history` を利用
- **Vite プラグイン**: ページ構造と params 定義から `RouteNames` と `RouteParams` を自動生成

---

## Goals

- React と Vue 向けの軽量ルーターを提供
- 柔軟 DSL による型安全な params 定義
- GAS 環境に最適化されたクエリ駆動ルーティング (`?page=...` を使用。`page=index` やパラメータなしはルートとして解釈)
- Vite プラグインによる DX 向上 (型自動生成)
- 将来的に Zod を導入可能な拡張性を確保

---

## File-based Routing

### ディレクトリ構造

```txt
src/pages/
  index.tsx       // ルートは ''
  about.vue
  users/
    show.tsx      // ルートは 'users/show'
```

### 自動生成される型

```ts
// .generated/router.d.ts
export type RouteNames =
  | ""
  | "about"
  | "users/show";

export interface RouteParams {
  "": {};
  about: {};
  "users/show": { userId: string };
}
```

---

## 柔軟 DSL の仕様

### サポートする型表現

- `"string"` / `"string?"`
- `"number"` / `"number?"`
- `"boolean"` / `"boolean?"`
- `{ type: "enum", values: string[], optional?: boolean }`
- `{ type: "array", items: DSL, optional?: boolean }`
- `{ type: "object", shape: Record<string, DSL>, optional?: boolean }`

### ページファイル例

```tsx
// src/pages/users/show.tsx
export const params = {
  userId: "string",
};

export default function UserShowPage({ userId }: { userId: string }) {
  return <div>User ID: {userId}</div>;
}
```

---

## Public API

### Core

- `createRouter<R, P>(pages, options)`: ルーターインスタンスを生成

### React

```ts
import { RouterProvider, RouterOutlet, useNavigate, useParams, useRoute } from "@ciderjs/city-gas/react";

// 型安全なナビゲーション
const navigate = useNavigate();
navigate("users/show", { userId: "123" });

// パラメータ取得
const params = useParams();

// ルート情報全体
const route = useRoute();
```

### Vue

```ts
import { createRouterPlugin, RouterOutlet, useNavigate, useParams, useRoute } from "@ciderjs/city-gas/vue";

// main.ts
const app = createApp(App);
app.use(createRouterPlugin(router));

// Component.vue
const navigate = useNavigate();
navigate("users/show", { userId: "123" });

const params = useParams();
const route = useRoute();
```

---

## Vite プラグイン

### Responsibilities

- `src/pages/**/*.{tsx,vue}` を探索
- ファイル名からルート名を生成
- `params` オブジェクトを解析し、必須/任意/enum/配列/ネストを型に変換
- `.generated/router.d.ts` と `.generated/routes.ts` を出力
- HMR 対応でファイル追加/削除/変更時に型を再生成

### 変換ロジック (再帰)

- プリミティブ: `"string" → string`, `"string?" → string | undefined`
- enum: `values` を union 型に展開
- array: `items` を再帰的に展開し `T[]`
- object: `shape` を再帰的に展開し `{ ... }`

---

## Error handling

- 未定義のルート → `defaultRoute` にフォールバック
- GAS API 未定義 → ブラウザモードにフォールバック
- params 不一致 → TypeScript コンパイルエラー
- DSL が不正 → ビルドエラー

---

## Roadmap

- **v0.1.0:** 柔軟 params DSL (配列/ネスト対応) + 型生成 + navigate API
- **v0.2.0:** React/Vue サポート、Hooks と Composables の実装
- **v0.3.0:** 動的ルート `[id].tsx` 対応 (オプション機能)
- **v0.4.0:** Zod スキーマ対応 (DSL → Zod マッピング)
- **v1.0.0:** 安定版リリース

---

# city-gas 要件定義書 (柔軟 params DSL・File-based Routing)

---

## 概要

**city-gas** は、Google Apps Script (GAS) 環境とブラウザ環境の両方で動作する React 向け TypeScript 製ルーター。  
特徴は以下の通り:

- **ファイルベースルーティング**: `src/pages/` 以下のファイル構造をルートに変換
- **柔軟 params DSL**: ページごとに `export const params = { ... }` を宣言し、必須/任意、enum、配列、ネストオブジェクトを表現可能
- **型安全な navigate**: `router.navigate("pageName", params)` が IDE 補完され、型エラーを防止
- **環境抽象化**: GAS 環境では `google.script.url` / `google.script.history` を利用、ブラウザでは `window.location` / `window.history` を利用
- **Vite プラグイン**: ページ構造と params 定義から `RouteNames` と `RouteParams` を自動生成
- **将来的な Zod 移行を想定**: 柔軟 DSL を Zod にマッピングできるよう設計

---

## Goals

- React 向けの軽量ルーターを提供
- 柔軟 DSL による型安全な params 定義
- GAS 環境に最適化されたクエリ駆動ルーティング (`?page=...` を使用。`page=index` やパラメータなしはルートとして解釈)
- Vite プラグインによる DX 向上 (型自動生成)
- 将来的に Zod を導入可能な拡張性を確保

---

## File-based Routing

### ディレクトリ構造

```txt
src/pages/
  main.tsx
  detail.tsx
  settings/
    index.tsx
    profile.tsx
```

### 自動生成される型

```ts
// .generated/router.d.ts
export type RouteNames =
  | "main"
  | "detail"
  | "settings"
  | "settings/profile";

export interface RouteParams {
  main: {};
  detail: { id: string; tags?: string[] };
  "settings": {};
  "settings/profile": { filter?: { tab?: "general" | "security"; showHidden?: boolean } };
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
// src/pages/detail.tsx
export const params = {
  id: "string",
  tags: { type: "array", items: "string?", optional: true },
};

export default function DetailPage({ id, tags }: { id: string; tags?: string[] }) {
  return <div>Detail {id} (tags: {tags?.join(",")})</div>;
}
```

```tsx
// src/pages/settings/profile.tsx
export const params = {
  filter: {
    type: "object",
    shape: {
      tab: { type: "enum", values: ["general", "security"] },
      showHidden: "boolean?",
    },
  },
};

export default function ProfilePage({ filter }: { filter?: { tab?: "general" | "security"; showHidden?: boolean } }) {
  return <div>Profile {filter?.tab} (hidden: {filter?.showHidden ? "yes" : "no"})</div>;
}
```

---

## Public API

### Router

```ts
import { createRouter, RouterProvider, RouterOutlet } from "city-gas";
import type { RouteNames, RouteParams } from "./.generated/router";
import { pages } from "./.generated/routes";

const router = createRouter<RouteNames, RouteParams>(pages, { defaultRouteName: '' });

// アプリケーションのどこかで...
<RouterProvider router={router}>
  <RouterOutlet />
</RouterProvider>

// 型安全なナビゲーション
router.navigate("detail", { id: "123", tags: ["a", "b"] });
```

---

## Vite プラグイン

### Responsibilities

- `src/pages/**/*.tsx` を探索
- ファイル名からルート名を生成
- `params` オブジェクトを解析し、必須/任意/enum/配列/ネストを型に変換
- `.generated/router.d.ts` を出力
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
- **v0.2.0:** `useParams` Hook で型推論を強化
- **v0.3.0:** 動的ルート `[id].tsx` 対応 (オプション機能)
- **v0.4.0:** Zod スキーマ対応 (DSL → Zod マッピング)
- **v1.0.0:** 安定版リリース

---

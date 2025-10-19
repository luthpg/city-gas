# city-gas 全体設計書

---

## 1. システム概要

**city-gas** は、Google Apps Script (GAS) 環境およびブラウザ環境で動作する React 向け TypeScript 製ルーター。  
特徴は以下の通り:

- **ファイルベースルーティング**: `src/pages/` 以下の構造をルートに変換
- **柔軟 params DSL**: ページごとに `params` を宣言し、必須/任意、enum、配列、ネストオブジェクトを表現可能
- **型安全な navigate**: `router.navigate("pageName", params)` が IDE 補完される
- **環境抽象化**: GAS とブラウザの両方に対応
- **Vite プラグイン**: ルートと params から `.d.ts` を自動生成
- **将来的な Zod 移行を想定**

---

## 2. アーキテクチャ構成

### コンポーネント構成

- **Router Core**
  - ルート管理 (`RouteNames`, `RouteParams`)
  - `navigate`, `useRoute`, `RouterProvider`, `RouterOutlet` を提供
- **Environment Adapter**
  - GAS Adapter: `google.script.url`, `google.script.history`
  - Browser Adapter: `window.location`, `window.history`
- **Vite Plugin**
  - `src/pages/**/*.tsx` を探索
  - `params` DSL を解析し、型定義 (`.generated/router.d.ts`) を生成
  - ルートとコンポーネントのマッピング情報 (`.generated/routes.ts`) を生成
- **Generated Files**
  - `router.d.ts`: `RouteNames`, `RouteParams` の型定義
  - `routes.ts`: ルート名とコンポーネントの対応マップ

---

## 3. データフロー

1. **開発時**
   - 開発者が `src/pages/xxx.tsx` に `params` DSL を定義
   - Vite プラグインが DSL とファイル構造を解析し、`.generated/router.d.ts` (型) と `.generated/routes.ts` (コンポーネントマップ) を生成
   - IDE 補完が有効化される

2. **実行時**
   - `createRouter` が `.generated/routes.ts` からコンポーネントマップを読み込む
   - Router Core が現在の URL を Environment Adapter 経由で取得
   - クエリパラメータを `RouteParams` にマッピング
   - `RouterProvider` がルーターから現在のルートに対応するコンポーネントを取得し、レンダリング
   - `navigate` 呼び出しで URL を更新し、再レンダリング

---

## 4. DSL → TypeScript 型変換ルール

### プリミティブ

- `"string"` → `string`
- `"string?"` → `string | undefined`
- `"number"` → `number`
- `"number?"` → `number | undefined`
- `"boolean"` → `boolean`
- `"boolean?"` → `boolean | undefined`

### enum

- `{ type: "enum", values: ["a","b"], optional?: true }`
- → `"a" | "b"` (+ `| undefined` if optional)

### array

- `{ type: "array", items: DSL, optional?: true }`
- → `(${dslToTs(items)})[]` (+ `| undefined` if optional)

### object

- `{ type: "object", shape: { foo: DSL, bar: DSL }, optional?: true }`
- → `{ foo: ..., bar: ... }` (+ `| undefined` if optional)

---

## 5. API 設計

### Router API

- `createRouter<R, P>(pages: Record<R, React.FC>, options?: { defaultRouteName?: R })`
- `router.navigate(name: R, params?: P[R])`
- `useRoute(): { route: { name: R, params: P[R] } }`
- `useNavigate(): (name: R, params?: P[R]) => void`
- `useParams(): P[R]`
- `<RouterProvider router={router}>...</RouterProvider>`
- `<RouterOutlet />`

---

## 6. Vite プラグイン設計

- **入力**: `src/pages/**/*.tsx`
- **処理**:
  - AST 解析で `export const params` を抽出
  - DSL を再帰的に解析し TS 型文字列を生成
  - ルート名をファイルパスから導出
- **出力**: `.generated/router.d.ts`, `.generated/routes.ts`
- **HMR 対応**: ファイル追加/削除/変更で型を再生成

---

## 7. エラーハンドリング

- 未定義ルート → `defaultRoute` にフォールバック
- DSL 不正 → ビルドエラー
- params 不一致 → TypeScript コンパイルエラー
- GAS API 未定義 → ブラウザモードにフォールバック

---

## 8. ロードマップ

- **v0.1.0:** 柔軟 params DSL (配列/ネスト対応) + 型生成 + navigate API
- **v0.2.0:** `useParams` Hook で型推論を強化
- **v0.3.0:** 動的ルート `[id].tsx` 対応 (オプション機能)
- **v0.4.0:** Zod スキーマ対応 (DSL → Zod マッピング)
- **v1.0.0:** 安定版リリース

---

## 9. プロジェクト構成

```txt
city-gas/
├─ src/
│  ├─ core/
│  │   ├─ router.ts        # Router Core (createRouter, navigate, etc.)
│  │   ├─ provider.tsx     # RouterProvider (Context) & RouterOutlet (Rendering)
│  │   └─ hooks.ts         # useRoute, useParams, useNavigate
│  ├─ env/
│  │   ├─ browser.ts       # Browser Adapter
│  │   ├─ gas.ts           # GAS Adapter
│  │   └─ index.ts         # Adapter 切替
│  ├─ plugin/
│  │   ├─ dslToTs.ts       # DSL → TS 型変換（再帰）
│  │   ├─ generator.ts     # 型ファイル生成ロジック
│  │   └─ index.ts         # Vite プラグインエントリ
│  └─ index.ts             # ライブラリエントリ
│
├─ test/
│  ├─ dslToTs.test.ts      # DSL → TS 型変換の単体テスト
│  ├─ router.test.ts       # Router Core のテスト
│  └─ adapter.test.ts      # Adapter のテスト
│
├─ .biome.json             # biome 設定 (lint/format)
├─ tsconfig.json
├─ package.json
├─ vitest.config.ts
└─ build.config.ts         # unbuild 設定
```

---

# city-gas 全体設計書

---

## 1. システム概要

**@ciderjs/city-gas** は、Google Apps Script (GAS) 環境およびブラウザ環境で動作する、**React および Vue** 向けの TypeScript 製ルーター。  
特徴は以下の通り:

- **ファイルベースルーティング**: `src/pages/` 以下の構造をルートに変換
- **柔軟 params DSL**: ページごとに `params` を宣言し、必須/任意、enum、配列、ネストオブジェクトを表現可能
- **型安全な navigate**: `router.navigate("pageName", params)` が IDE 補完される
- **フレームワーク対応**: React Hooks と Vue Composables の両方を提供
- **環境抽象化**: GAS とブラウザの両方に対応
- **Vite プラグイン**: ルートと params から `.d.ts` を自動生成
- **将来的な Zod 移行を想定**

---

## 2. アーキテクチャ構成

### コンポーネント構成

- **Router Core**
  - ルート管理 (`RouteNames`, `RouteParams`)
  - `navigate`, `subscribe`, `getCurrentRoute` を提供
- **Framework Adapters**
  - **React Adapter**: `useNavigate`, `useParams`, `useRoute`, `RouterProvider`, `RouterOutlet`
  - **Vue Adapter**: `useNavigate`, `useParams`, `useRoute`, `createRouterPlugin`, `RouterOutlet`
- **Environment Adapter**
  - GAS Adapter: `google.script.url`, `google.script.history`
  - Browser Adapter: `window.location`, `window.history`
- **Vite Plugin**
  - `src/pages/**/*.{tsx,vue}` を探索
  - `params` DSL を解析し、型定義 (`.generated/router.d.ts`) を生成
  - ルートとコンポーネントのマッピング情報 (`.generated/routes.ts`) を生成
- **Generated Files**
  - `router.d.ts`: `RouteNames`, `RouteParams` の型定義
  - `routes.ts`: ルート名とコンポーネントの対応マップ

---

## 3. データフロー

1. **開発時**
   - 開発者が `src/pages/xxx.tsx` または `xxx.vue` に `params` DSL を定義
   - Vite プラグインが DSL とファイル構造を解析し、`.generated/router.d.ts` (型) と `.generated/routes.ts` (コンポーネントマップ) を生成
   - IDE 補完が有効化される

2. **実行時**
   - `createRouter` が `.generated/routes.ts` からコンポーネントマップを読み込む
   - Router Core が現在の URL を Environment Adapter 経由で取得
   - クエリパラメータを `RouteParams` にマッピング
   - Framework Adapter (`RouterProvider` or `app.use(plugin)`) がルーターを注入
   - `RouterOutlet` が現在のルートに対応するコンポーネントをレンダリング
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

## 5. API 設計

### Core API

- `createRouter<R, P>(pages, options)`
- `router.navigate(name, params, options)`
- `router.subscribe(listener)`
- `router.getCurrentRoute()`

### React API

- `useNavigate(): (name, params) => void`
- `useParams(): P[R]`
- `useRoute(): { route: { name, params } }`
- `<RouterProvider router={router}>`
- `<RouterOutlet />`

### Vue API

- `createRouterPlugin(router)`: Vue プラグインとして登録
- `useNavigate(): (name, params) => void`
- `useParams(): P[R]`
- `useRoute(): { route: { name, params } }`
- `<RouterOutlet />`

---

## 6. Vite プラグイン設計

- **入力**: `src/pages/**/*.{tsx,vue}`
- **処理**: AST 解析で `export const params` を抽出
- **出力**: `.generated/router.d.ts`, `.generated/routes.ts`
- **HMR 対応**: ファイル変更で型を再生成

---

## 7. エラーハンドリング

- 未定義ルート → `defaultRoute` にフォールバック
- DSL 不正 → ビルドエラー
- params 不一致 → TypeScript コンパイルエラー
- GAS API 未定義 → ブラウザモードにフォールバック

---

## 8. ロードマップ

- **v0.1.0:** 柔軟 params DSL + 型生成 + navigate API
- **v0.2.0:** React/Vue サポート、Hooks と Composables の実装
- **v0.3.0:** 動的ルート `[id].tsx` 対応
- **v0.4.0:** Zod スキーマ対応
- **v1.0.0:** 安定版リリース

---

## 9. プロジェクト構成

```txt
src/
├─ core/
│   └─ router.ts        # Router Core (createRouter, navigate, etc.)
├─ adapters/
│   ├─ react/           # React Adapter
│   │   ├─ hooks.ts
│   │   ├─ provider.tsx
│   │   └─ RouterOutlet.tsx
│   └─ vue/             # Vue Adapter
│       ├─ composables.ts
│       ├─ plugin.ts
│       └─ RouterOutlet.ts
├─ env/
│   ├─ browser.ts       # Browser Adapter
│   ├─ gas.ts           # GAS Adapter
│   └─ index.ts         # Adapter 切替
├─ plugin/
│   ├─ dslToTs.ts       # DSL → TS 型変換
│   ├─ generator.ts     # 型ファイル生成ロジック
│   └─ index.ts         # Vite プラグインエントリ
└─ index.ts             # ライブラリエントリ
```

---

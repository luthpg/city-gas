# city-gas 実装タスク分解

---

## Router Core

- [x] `createRouter` の実装（ジェネリクス、内部ストア、購読通知）
- [x] `navigate` の実装（クエリシリアライズ、履歴操作）
- [x] `subscribe` と `getCurrentRoute` の実装
- [x] `router.beforeEach` の実装（ナビゲーションガード）

---

## Framework Adapters

### React Adapter

- [x] `RouterProvider`: Context を通じてルーターインスタンスを注入
- [x] `RouterProvider`: `children`をオプショナル化し、`RouterOutlet`の自動レンダリングに対応
- [x] `RouterOutlet`: 現在のルートに対応するコンポーネントをレンダリング
- [x] `useNavigate`, `useParams`, `useRoute` Hooks: 型安全なナビゲーションとパラメータアクセスを提供
- [x] ネストされたルート (`_layout.tsx`, `_root.tsx`, `_404.tsx`) のサポート

### Vue Adapter

- [x] `createRouterPlugin`: `app.use()` でルーターインスタンスを注入
- [x] `RouterOutlet`: `createApp` のルートコンポーネントとして使用可能にする (対応不要・ドキュメント化)
- [x] `RouterOutlet`: 現在のルートに対応するコンポーネントをレンダリング
- [x] `useNavigate`, `useParams`, `useRoute` Composables: Composition API での型安全な操作を提供
- [x] ネストされたルート (`_layout.vue`, `_root.vue`, `_404.vue`) のサポート

---

## Environment Adapter

- [x] **GAS Adapter**: `google.script.url` と `google.script.history` をラップ
- [x] **Browser Adapter**: `window.location` と `window.history` をラップ
- [x] **Adapter 切替**: 実行環境を判定し、適切な Adapter を選択

---

## Vite Plugin

- [x] **ページ探索**: `src/pages/**/*.{tsx,vue}` を `fast-glob` で探索
- [x] **AST 解析**: `export const params` を `typescript` で解析・抽出
- [x] **DSL → TS 型変換**: `dslToTs` 再帰関数による型定義文字列の生成
- [x] **型ファイル生成**: `router.d.ts` と `routes.ts` を生成・書き出し
- [x] **HMR 対応**: ファイル変更を監視し、型ファイルを即時再生成
- [x] **動的パスパラメータ**: `[param].tsx` などのパスパラメータを解析し、型生成に統合
- [x] **競合解決**: `index` ファイル（例: `test/index.tsx`）が通常ファイル（例: `test.tsx`）より優先されるよう `generator.ts` を修正。
- [x] **競合解決**: 競合を検出し、コンソールに `warn` を出力する。
- [x] **HMR キャッシュ戦略 (ファイルキャッシュ)**: プラグインのインメモリ `Map` に `Map<filePath, { mtimeMs, params, routeInfo }>` を保持する。
- [x] **HMR キャッシュ戦略 (I/O削減)**: `fs.statSync` で `mtimeMs` を比較し、変更があったファイルのみ `fs.readFileSync` と `extractParams` を実行する。
- [x] **HMR キャッシュ戦略 (unlink対応)**: `fast-glob` の結果とキャッシュを比較し、削除されたファイルをキャッシュから除去する。
- [x] **HMR キャッシュ戦略 (コンテンツキャッシュ)**: 生成された `router.d.ts` と `routes.ts` の内容（文字列）をキャッシュし、変更がない場合は `fs.writeFileSync` をスキップする。

---

## テスト

- [x] **単体テスト**: DSL → TS 型変換、クエリシリアライズ、Hooks/Composables
- [ ] **統合テスト**: React/Vue 環境でのルーター全体の動作確認
- [x] **単体テスト**: ネストされたルートの解決ロジック
- [x] **単体テスト**: ナビゲーションガード
- [ ] **E2E テスト**: GAS/ブラウザ環境での実動作確認
- [x] **単体テスト (Vite Plugin)**: ルート競合解決（`index` 優先）のテストケースを追加。
- [x] **単体テスト (Vite Plugin)**: キャッシュ戦略（`add`, `change`, `unlink`) 時のI/O動作（`stat`, `read`, `write` の呼び出し回数）をモックを使用してテスト。

---

## ロードマップ

| version | 概要 | 対応状況 |
| --- | --- | --- |
| v0.1.0 | Router Core + Environment Adapter + Vite Plugin (DSL → 型生成) | 完了 |
| v0.2.0 | React/Vue サポート、Hooks と Composables の実装、ネストされたルート | 完了 |
| v0.3.0 | 動的ルート `[id].tsx` 対応、ナビゲーションガード | 完了 |
| v0.4.0 | Zod スキーマ対応 | 未着手 |
| v1.0.0 | 安定版リリース | 未着手 |

---

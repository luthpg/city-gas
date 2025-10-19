# city-gas 実装タスク分解（詳細版）

---

## Router Core

### createRouter

- [✅] ルーターインスタンスの型定義（RouteNames, RouteParams をジェネリクスで受け取る）
- [✅] 現在のルート状態を保持する内部ストアを実装
- [✅] 初期化時に Environment Adapter から現在の URL を取得
- [✅] ルート変更時に購読者へ通知する仕組みを実装（イベントエミッタ or React state）

### navigate

- [✅] `router.navigate(name, params)` のシグネチャ定義
- [✅] RouteParams に基づく型安全な引数チェック
- [✅] params をクエリ文字列にシリアライズする関数を実装
- [✅] Environment Adapter 経由で URL を更新
- [✅] 履歴操作（push/replace）のオプションをサポート

### useRoute

- [✅] React Hook として現在のルート情報を返す
- [✅] Router Core の内部ストアを購読し、再レンダリングをトリガー
- [✅] `params` を型安全に返す

### RouterProvider

- [✅] React Context を作成し Router インスタンスを注入
- [✅] 子コンポーネントで useRoute が利用可能になるようにする

### RouterOutlet

- [✅] `RouterProvider` のコンテキストから現在のルートを取得
- [✅] ルートに対応するコンポーネントをレンダリング

---

## Environment Adapter

### GAS Adapter

- [✅] `google.script.url.getLocation` をラップして現在のクエリを取得
- [✅] `google.script.history.push/replace` をラップして履歴操作を実装
- [✅] GAS 環境でのみ動作するようガードを追加

### Browser Adapter

- [✅] `window.location.search` を解析してクエリを取得
- [✅] `window.history.pushState/replaceState` を利用して履歴操作を実装
- [✅] popstate イベントを購読してルート変更を検知

### Adapter 切替

- [✅] 実行環境を判定する関数を実装
- [✅] Router Core 初期化時に適切な Adapter を選択

---

## Vite Plugin

### ページ探索

- [✅] `glob("src/pages/**/*.tsx")` で対象ファイルを列挙
- [✅] ファイルパスからルート名を導出（`src/pages/settings/profile.tsx` → `"settings/profile"`）

### AST 解析

- [✅] `export const params = ...` を抽出
- [✅] DSL オブジェクトを JSON として評価可能な形に変換

### DSL → TS 型変換

- [✅] `dslToTs` 再帰関数を実装
  - [✅] プリミティブ型変換
  - [✅] enum 型変換
  - [✅] array 型変換
  - [✅] object 型変換
- [✅] optional 判定（`"?"` or `optional: true`）を統一的に処理

### 型ファイル生成

- [✅] `RouteNames` を union 型として出力
- [✅] `RouteParams` を interface として出力
- [✅] `.generated/router.d.ts` に書き出し
- [ ] 差分更新で不要な再ビルドを避ける

### コンポーネントマップ生成

- [✅] ページコンポーネントの `import` 文を生成
- [✅] ルート名とコンポーネントをマッピングする `pages` オブジェクトを生成
- [✅] `.generated/routes.ts` に書き出し

### HMR 対応

- [✅] ファイル追加/削除を監視
- [✅] 型ファイルを再生成
- [✅] IDE 補完が即時反映されるようにする

---

## Generated Types

- [✅] `RouteNames` の自動生成（ファイルパスベース）
- [✅] `RouteParams` の自動生成（DSL ベース）
- [ ] 型ファイルの安定化（順序保証、diff 最小化）

---

## テスト

### 単体テスト

- [✅] DSL → TS 型変換のテスト
  - [✅] プリミティブ
  - [✅] enum
  - [✅] array
  - [✅] object
  - [✅] ネスト構造
- [✅] navigate のクエリシリアライズテスト
- [✅] useRoute の Hook テスト

### 統合テスト

- [ ] RouterProvider + navigate + useRoute の一連の動作確認
- [ ] GAS Adapter のモックテスト
- [ ] Browser Adapter の実ブラウザテスト（JSDOM）

---

## ロードマップ

- **v0.1.0:** Router Core + Environment Adapter + Vite Plugin (DSL → 型生成)
- **v0.2.0:** useParams Hook 強化、テスト整備
- **v0.3.0:** 動的ルート `[id].tsx` 対応
- **v0.4.0:** Zod スキーマ対応
- **v1.0.0:** 安定版リリース

---

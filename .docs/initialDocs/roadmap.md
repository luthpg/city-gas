# Roadmap

## Milestone: v0.1.0 — 基盤構築 & 型生成

--------------------------------------------------

- Issue: Router Core - createRouter の型定義とインスタンス生成
- Issue: Router Core - 内部ストア（現在のルート状態保持）
- Issue: Router Core - navigate のシグネチャ定義とクエリシリアライズ
- Issue: Router Core - RouterProvider 実装（Context 提供）
- Issue: Router Core - useRoute Hook 実装
- Issue: Environment Adapter - Browser Adapter 実装（window.location, window.history）
- Issue: Environment Adapter - GAS Adapter 実装（google.script.url, google.script.history）
- Issue: Environment Adapter - Adapter 切替ロジック
- Issue: Vite Plugin - ページ探索（glob）
- Issue: Vite Plugin - ルート名導出（ファイルパス → ルート名）
- Issue: Vite Plugin - AST 解析で params 抽出
- Issue: Vite Plugin - DSL → TS 型変換関数（dslToTs 再帰）
- Issue: Vite Plugin - .generated/router.d.ts 出力
- Issue: テスト - DSL → TS 型変換の単体テスト
- Issue: テスト - Router Core の基本テスト

## Milestone: v0.2.0 — DX 強化

--------------------------------------------------

- Issue: Router Core - useParams Hook 実装（型推論強化）
- Issue: Router Core - useNavigate Hook 実装
- Issue: Vite Plugin - HMR 対応（ファイル追加/削除/変更で型再生成）
- Issue: Vite Plugin - 型ファイルの安定化（順序保証、差分更新）
- Issue: エラーハンドリング - 未定義ルート → defaultRoute フォールバック
- Issue: エラーハンドリング - DSL 不正時のビルドエラー
- Issue: エラーハンドリング - params 不一致時の型エラー

## Milestone: v0.3.0 — 動的ルート対応

--------------------------------------------------

- Issue: 動的ルート - [id].tsx の検出
- Issue: 動的ルート - ファイル名からパラメータ抽出
- Issue: 動的ルート - クエリ駆動モデルへのマッピング
- Issue: 動的ルート - 型生成に統合

## Milestone: v0.4.0 — Zod 対応

--------------------------------------------------

- Issue: Zod - DSL → Zod スキーマ変換
- Issue: Zod - z.infer による型生成
- Issue: Zod - navigate 時の実行時バリデーション
- Issue: Zod - DSL と Zod の併用サポート

## Milestone: v1.0.0 — 安定版リリース

--------------------------------------------------

- Issue: テスト - DSL, Router Core, Adapter の単体テスト網羅
- Issue: テスト - Router Core の統合テスト
- Issue: テスト - GAS Adapter のモックテスト
- Issue: テスト - Browser Adapter の実ブラウザテスト
- Issue: ドキュメント - README（導入方法、DSL 記法、サンプルコード）
- Issue: ドキュメント - API リファレンス
- Issue: ドキュメント - チュートリアル記事執筆（Zenn など）
- Issue: 公開 - npm リリース

# Roadmap

## Milestone: v0.1.0 — 基盤構築 & 型生成

--------------------------------------------------

- [x] Issue: Router Core - createRouter の型定義とインスタンス生成
- [x] Issue: Router Core - 内部ストア（現在のルート状態保持）
- [x] Issue: Router Core - navigate のシグネチャ定義とクエリシリアライズ
- [x] Issue: Environment Adapter - Browser/GAS Adapter 実装と切替ロジック
- [x] Issue: Vite Plugin - ページ探索、AST 解析、DSL → TS 型変換、型ファイル生成
- [x] Issue: テスト - DSL → TS 型変換の単体テスト

## Milestone: v0.2.0 — React/Vue サポート & DX 強化

--------------------------------------------------

- [x] Issue: React Adapter - RouterProvider, RouterOutlet 実装
- [x] Issue: React Adapter - useNavigate, useParams, useRoute Hooks 実装
- [x] Issue: Vue Adapter - createRouterPlugin, RouterOutlet 実装
- [x] Issue: Vue Adapter - useNavigate, useParams, useRoute Composables 実装
- [x] Issue: DX 強化 - `App.tsx`/`App.vue` ラッパーコンポーネントの排除
- [x] Issue: ネストされたルート - `_layout.tsx`, `_root.tsx`, `_404.tsx` のサポート
- [x] Issue: Vite Plugin - HMR 対応（ファイル変更で型再生成）
- [x] Issue: エラーハンドリング - 未定義ルート → defaultRoute フォールバック

## Milestone: v0.3.0 — 動的ルート & ナビゲーションガード対応

--------------------------------------------------

- [ ] Issue: 動的ルート - `[id].tsx` の検出と型安全なパスパラメータ抽出
- [ ] Issue: 動的ルート - 型生成への統合
- [ ] Issue: ナビゲーションガード - `router.beforeEach` API の実装

## Milestone: v0.4.0 — Zod 対応

--------------------------------------------------

- [ ] Issue: Zod - DSL → Zod スキーマ変換
- [ ] Issue: Zod - z.infer による型生成と実行時バリデーション

## Milestone: v1.0.0 — 安定版リリース

--------------------------------------------------

- [ ] Issue: テスト - React/Vue Adapter のテスト網羅
- [ ] Issue: テスト - 統合テスト、E2E テストの拡充
- [ ] Issue: ドキュメント - README、API リファレンス、チュートリアルの完成
- [ ] Issue: 公開 - npm パッケージの公開

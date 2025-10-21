# Roadmap

## Milestone: v0.1.0 — 基盤構築 & 型生成

--------------------------------------------------

- [✅] Issue: Router Core - createRouter の型定義とインスタンス生成
- [✅] Issue: Router Core - 内部ストア（現在のルート状態保持）
- [✅] Issue: Router Core - navigate のシグネチャ定義とクエリシリアライズ
- [✅] Issue: Environment Adapter - Browser/GAS Adapter 実装と切替ロジック
- [✅] Issue: Vite Plugin - ページ探索、AST 解析、DSL → TS 型変換、型ファイル生成
- [✅] Issue: テスト - DSL → TS 型変換の単体テスト

## Milestone: v0.2.0 — React/Vue サポート & DX 強化

--------------------------------------------------

- [✅] Issue: React Adapter - RouterProvider, RouterOutlet 実装
- [✅] Issue: React Adapter - useNavigate, useParams, useRoute Hooks 実装
- [✅] Issue: Vue Adapter - createRouterPlugin, RouterOutlet 実装
- [✅] Issue: Vue Adapter - useNavigate, useParams, useRoute Composables 実装
- [✅] Issue: Vite Plugin - HMR 対応（ファイル変更で型再生成）
- [✅] Issue: エラーハンドリング - 未定義ルート → defaultRoute フォールバック

## Milestone: v0.3.0 — 動的ルート対応

--------------------------------------------------

- [ ] Issue: 動的ルート - `[id].tsx` の検出とパラメータ抽出
- [ ] Issue: 動的ルート - 型生成への統合

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

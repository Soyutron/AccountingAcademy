# 0003. 技術スタック

日付: 2026-11-07
状態: 採用(ユーザー決定 2026-11-07。比較は `docs/tech-stack.md`、構成は `docs/architecture.md`)

## 背景
個人開発、初期は無料・ゲストのみ、content as code、将来アカウント・同期・B2B・AI 解説を足す。AI エージェント主導で開発するため、公式 Skills / MCP と学習データの豊富さを重視する(要件 7 章、tech-stack.md 0 章)。
提案時は「MVP は静的エクスポート、Supabase はフェーズ 7 から」としていたが、誤解の検出に学習者をまたいだ回答データが要ること、
ゲスト → 本登録の引き継ぎが Supabase の匿名ユーザー昇格で自然に解けることから、Supabase を MVP から入れ、静的エクスポートの前提を外した。

## 決定
- TypeScript / Node.js 24 / pnpm。
- Next.js 16 App Router。標準出力(`output: 'standalone'`)。解説・用語集・概念マップはビルド時に静的生成し、認証と進捗の部分だけ動的にする。静的エクスポートは前提にしない。
- Supabase を MVP から使う。範囲は Auth(匿名サインイン、メール、Google)と `unit_progress` / `attempts` の 2 テーブル。ORM は入れず supabase-js + RLS + 生成型。
- 採点は純粋関数としてクライアントで完結させる。コンテンツはリポジトリで管理し DB に置かない(architecture.md 3 章)。
- Tailwind CSS v4 + shadcn/ui。
- コンテンツは Velite で zod 検証し、横断検査を `complete` フックで行う。用語参照は remark-wiki-link、仕訳ブロックは自作 rehype プラグイン 1 つ。MDX は使わない。
- 概念マップは React Flow + elkjs。用語集の検索はライブラリなし。
- テストは Vitest / React Testing Library / Playwright。Supabase はローカルスタックで検証する。Lint は ESLint(eslint-config-next)+ Prettier。CI は GitHub Actions。
- ホスティングは当初未決。2026-11-07 に VPS 1 台(さくらの VPS + Coolify)へ決定(ADR 0006)。
- Skills / MCP: next-devtools-mcp、vercel-labs の React / Next.js Skills、shadcn MCP、Context7、Playwright MCP、Chrome DevTools MCP、Supabase MCP(read_only 既定)。Vercel MCP はホスト決定後。

## 検討した代替
- Astro + React islands: content as code には最適だが、操作中心の要件と認証・同期で設計が二重になるため次点。
- 進捗をブラウザ保存のみにする案: 単純だが、学習者をまたいだ誤解の分析ができず、引き継ぎ処理を別途作ることになるため不採用(architecture.md 3.2)。
- コンテンツを Supabase に置く案: 検証・レビュー・バージョン管理を自作することになるため不採用(architecture.md 3.3)。
- Neon + Better Auth、Drizzle: 部品が増えるため見送り。必要になってから。

## 影響
- Velite の Next.js 連携は公式プラグインが無いので、`velite build` を `next build` / `next dev` の前段として package.json スクリプトで繋ぐ。
- 匿名ユーザーの定期削除(90 日)と、β 開始時点でのプライバシーポリシーが要る。
- 採用後、`.mcp.json` と `.agents/skills/` を整備し、`CLAUDE.md` に使う Skills / MCP を記す。

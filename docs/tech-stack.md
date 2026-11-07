# 技術選定(v0.1 比較・推奨案)

更新日: 2026-11-07
状態: 比較の記録。決定は ADR 0003(採用済み)と `docs/architecture.md` を正とする。決定時に変わった点: 静的エクスポートを前提にしない、Supabase を MVP から入れる(Auth + 2 テーブル)、ORM は入れない、ホスティングは未決。

## 0. 前提(要件から導かれる制約)
- 個人開発。保守対象を少なく、学習コストを低く。
- 初期は無料・ゲストのみ。**MVP はサーバー側の状態を持たない**(静的配信 + ブラウザ内の採点と進捗保存)。
- content as code。Markdown + YAML を git で管理し、ビルド時に参照整合性・用語の未説明・前提の循環を検査する。
- 将来: アカウントと同期(フェーズ 7)、2 級以降・B2B・AI 解説(フェーズ 8 以降)。これらを **妨げない** ことは必要だが、今作らない。
- AI エージェント(Claude Code)との親和性。公式の Skills / MCP があり、学習データが豊富で、エラーをエージェントが直接観測できること。

## 1. 技術領域と候補の比較

### 1.1 言語・ランタイム
| 候補 | 評価 |
|---|---|
| **TypeScript + Node.js 24 LTS**(推奨) | フロントとコンテンツ処理と将来のサーバーを 1 言語で書ける。zod の型をコンテンツ・採点・API で共有できる |
| Python(バックエンドのみ) | MVP にサーバーが無いので出番がない。AI 解説を足すときも TypeScript の SDK で足りる |

パッケージマネージャは **pnpm**(ローカルに 11.x あり。厳密な依存解決とディスク効率)。

### 1.2 フロントエンドフレームワーク(最重要の選択)
| 候補 | 長所 | 短所 | 判定 |
|---|---|---|---|
| **Next.js 16(App Router, 静的エクスポート → 将来 SSR / Server Actions)** | React 一本で解説ページ・演習・ポップオーバー・概念マップ・進捗の状態共有を書ける。将来のアカウント機能も同じアプリに足せる。開発サーバーが MCP エンドポイント(`/_next/mcp`)を内蔵し、エージェントが実行時エラー・ルート・ログを直接読める。Vercel 公式の React / Next.js Skills がある。学習データが最も多い | フレームワークが大きく、更新が速い。静的コンテンツ中心のサイトとしては Astro より出力が重い | **推奨** |
| Astro 5 + React islands | Content Collections(zod 検証つき)が content as code にそのまま合う。静的出力が軽い。公式 Docs MCP(`mcp.docs.astro.build`)がある | 本サービスは「読む」より「操作する」部分が多い(演習、エディタ、全文に散る用語ポップオーバー、ページをまたぐ進捗)。islands 間の状態共有(nanostores 等)と、将来の認証・同期で設計が二重になる | 次点。コンテンツ閲覧が主体なら逆転する |
| SvelteKit / Nuxt | 軽量で書き味は良い | React に比べ UI ライブラリ・Skills・学習データが薄く、エージェント主導の開発で不利 | 不採用 |
| SPA(Vite + React Router) | 最も単純 | 静的 HTML が出ないので初回表示と検索性(用語集・解説)が弱い。Next.js の静的エクスポートで同じ単純さが得られる | 不採用 |

**Next.js を推奨する理由**: 要件の重心が「インタラクティブな学習ループ」にあり、React 単一ランタイムの方が状態設計が素直。
さらにフェーズ 7 でサーバー機能を同じコードベースに足せる。Astro の利点(Content Collections)は Velite で代替できる(1.4)。

### 1.3 UI(スタイル・コンポーネント)
| 候補 | 評価 |
|---|---|
| **Tailwind CSS v4 + shadcn/ui**(推奨) | Popover / HoverCard / Sheet / Dialog / Tabs が揃い、用語ポップオーバー(PC はホバー、スマホはボトムシート)をすぐ組める。コードをプロジェクトに取り込む方式なので依存の破壊的変更に強い。shadcn は公式 MCP を提供(`npx shadcn@latest mcp init`)。エージェントの生成精度が高い |
| MUI / Chakra | 完成度は高いがデザインの自由度と Tailwind との相性で劣る。学習サイトの読み物部分は独自スタイルが要る |
| CSS Modules のみ | ライブラリ依存は減るが、アクセシブルなポップオーバー・シートを自作することになる |

本文のタイポグラフィは `@tailwindcss/typography`。数式は不要(会計の計算は表と仕訳で表現する)。

### 1.4 コンテンツパイプライン(Markdown / YAML → 型付きデータ)
| 候補 | 評価 |
|---|---|
| **Velite**(推奨) | Markdown / MDX / YAML / JSON を zod スキーマで検証して型付き JSON にする。2026-06 に v0.4 リリースで保守中。`prepare` / `complete` フックでコレクション横断の検査(用語の未説明、前提の循環、仕訳の貸借一致)を書ける。Next.js とは `velite build` を `next build` の前段で走らせる(Turbopack 既定のため webpack プラグイン連携は使わない) |
| content-collections | 同系統だが今回の調査で保守状況を確認できなかった |
| Fumadocs(fumadocs-mdx) | ドキュメントサイト向けの完成品。学習サイトのナビゲーションとは構造が違い、剥がす部分が多い |
| 自作(gray-matter + zod + unified) | 依存は最小だが、ウォッチ・キャッシュ・型生成を自分で持つことになる。Velite が合わなかったときの退路 |

Markdown 拡張:
- `[[id|表示語]]` の用語参照は **remark-wiki-link**(別名区切り設定あり)で解釈し、Term コンポーネントに割り当てる。
- ```` ```journal ```` ブロックは rehype の段階で仕訳エディタのコンポーネントに置き換える(小さなプラグインを 1 つ書く。これは必要な独自実装)。
- MDX は使わない方針を推奨(執筆者が JSX を気にせず済む。必要なコンポーネントは上の 2 記法で足りる)。必要になれば Velite は MDX も扱える。

### 1.5 状態管理・ブラウザ保存(進捗レコード)
| 候補 | 評価 |
|---|---|
| **Zustand + persist(localStorage)**(推奨) | 進捗レコードを 1 ストアで持ち、ページをまたいで共有。persist で保存・復元・バージョン移行が標準機能。将来の同期は「ストアの内容をサーバーに送る」だけ |
| React Context + 自作 localStorage | 小規模なら足りるが、移行・部分更新・SSR 時の水和を自分で扱う |
| IndexedDB(Dexie) | 進捗レコードは数十 KB 規模なので不要 |

### 1.6 概念マップ
| 候補 | 評価 |
|---|---|
| **React Flow(@xyflow/react)+ elkjs**(推奨) | ノード・エッジの描画、ズーム、クリック、カスタムノードが揃う。自動レイアウトは elkjs(階層レイアウトが前提関係の表現に向く) |
| D3 force | 自由度は高いが実装量が多く、前提関係(方向つき階層)には向かない |
| Cytoscape.js | グラフ解析向き。React との統合が React Flow より手間 |

### 1.7 検索(用語集)
MVP は用語集 200 項目程度の部分一致(名前・別名・short)なので **ライブラリなし**(配列のフィルタ)で足りる。
サイト全体の全文検索が必要になったら Pagefind(静的サイト向け。日本語は分かち書きのみで活用形の正規化は無い)を検討する。

### 1.8 バックエンド・データベース・認証(フェーズ 7 で導入。今は「妨げない」だけ)
| 領域 | 推奨 | 代替 | 理由 |
|---|---|---|---|
| DB | **Supabase(Postgres)** | Neon(Postgres)+ 自前 API | Auth・DB・Storage が一体で個人開発に向く。公式 MCP(`mcp.supabase.com`、`read_only` と `project_ref` で範囲を絞れる、`search_docs` 内蔵)。Row Level Security で学習者ごとのデータ分離を DB 側で保証できる |
| ORM | **Drizzle ORM** | Prisma、Supabase クライアント(PostgREST) | SQL に近く型安全。マイグレーションも持つ。公式 MCP は無いが Context7 で docs を引ける |
| 認証 | **Supabase Auth(匿名サインイン → 本登録への昇格)** | Better Auth(anonymous プラグインで同等) | 「ゲストで始めて後からアカウントに引き継ぐ」要件に、匿名ユーザーを恒久ユーザーへ昇格させる機能がそのまま対応する |
| サーバー実行 | Next.js Route Handlers / Server Actions(Vercel) | Supabase Edge Functions | 同一コードベースに留める |

Neon + Better Auth はベンダーロックを避けたい場合の構成。機能は満たすが部品が増える。

### 1.9 インフラ・デプロイ
| 候補 | 評価 |
|---|---|
| **Vercel**(推奨) | Next.js の開発元。プレビューデプロイ、公式 MCP(`mcp.vercel.com`、ベータ、ドキュメント検索とデプロイ操作)。Hobby プランは個人・非商用向けで、無料提供の MVP は該当。商用化時に Pro へ |
| Cloudflare Pages / Workers(OpenNext) | 無料枠が広く商用でも安い。Next.js は OpenNext アダプタ経由で制約がある。静的エクスポートの間は問題なし | 商用化時の移行先候補 |
| 自前 VPS | 個人開発で運用負荷が見合わない | 不採用 |

静的エクスポートの間はどこにでも置ける。Vercel 固有機能(ISR、Image Optimization)に寄りかからない。

### 1.10 テスト
| 層 | 推奨 | 用途 |
|---|---|---|
| 単体 | **Vitest** | 採点エンジン(仕訳の順不同一致、別名解決、影響計算)、コンテンツ検査、進捗ストア |
| コンポーネント | Vitest + React Testing Library | 仕訳エディタ、ポップオーバー、演習フォーム |
| E2E | **Playwright** | 学習ループ(単元を開く → 演習を解く → 進捗が保存される)。Playwright MCP でエージェントが同じ操作を再現できる |
| コンテンツ | Velite のスキーマ + `complete` フックの検査をテストとして実行 | content-model.md 4 章の全検査 |

### 1.11 Lint・Format・CI
- **ESLint(eslint-config-next, flat config)+ Prettier**。Next.js 公式設定で Next 固有ルールが入る。Biome は 1 ツールで速いが Next 固有ルールの網羅が劣るため見送り。
- **GitHub Actions**: lint → 型検査 → Vitest → Velite build(コンテンツ検査)→ Playwright。Vercel の Git 連携でプレビュー。
- Git ホスティングは GitHub(`gh` CLI があり、エージェントが PR・Issue を扱える)。

### 1.12 将来の領域(今は決めない)
- AI 解説: Anthropic Claude API + Vercel AI SDK。LangChain 系スキルの再導入はこのとき判断(ADR 0001)。
- 監視: Sentry(公式 MCP あり)。分析: Vercel Analytics または Umami。
- メール(認証用): Resend。Supabase Auth の SMTP 設定で使う。

## 2. 推奨スタックの全体構成

```
[執筆]  content/**/*.md, *.yaml
   │  velite build(zod 検証 + 横断検査)
   ▼
[ビルド] Next.js 16 静的エクスポート(TypeScript, Tailwind v4, shadcn/ui)
   │  remark-wiki-link → Term(用語ポップオーバー) / ```journal → JournalEditor
   │  React Flow + elkjs(概念マップ)
   ▼
[配信]  Vercel(静的。後に Server Actions / Route Handlers を追加)
   │
[ブラウザ] 採点エンジン(純粋関数)+ Zustand persist(進捗レコード, learner_id)
   │
   └─ フェーズ 7 ──▶ Supabase(Postgres + Auth 匿名→本登録, RLS) + Drizzle
```

テスト: Vitest / React Testing Library / Playwright。Lint: ESLint + Prettier。CI: GitHub Actions。

## 3. Skills・MCP の一覧(推奨スタック向け)

| 名前 | 種別 | 用途 | 導入 | 確認状況 |
|---|---|---|---|---|
| next-devtools-mcp(Vercel 公式) | MCP(ローカル) | 起動中の Next.js 開発サーバーの実行時エラー・ルート・ログ・コンパイルエラーをエージェントが読む。版に合った docs 検索 | `claude mcp add next-devtools -- npx -y next-devtools-mcp@latest`(Next.js 16 以上、Node 20.19 以上) | 公式 docs で確認 |
| vercel-labs/agent-skills(react-best-practices) | Skill | React / Next.js の性能・設計ルール 40 超をコード生成時に適用 | `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices`(スキル名は要確認) | 公式リポジトリの存在を確認 |
| vercel-labs/next-skills(next-best-practices) | Skill | App Router のファイル規約、RSC 境界、データ取得、メタデータ、エラー処理 | `npx skills add vercel-labs/next-skills` | 同上 |
| shadcn MCP | MCP(ローカル) | コンポーネントの検索・追加をエージェントが正確に行う | `npx shadcn@latest mcp init --client claude` | shadcn 公式 docs の MCP ページで要確認 |
| Context7(Upstash) | MCP(HTTP) | Tailwind v4、Velite、Zustand、React Flow、Drizzle など公式 MCP の無いライブラリの版別 docs | `claude mcp add --transport http context7 https://mcp.context7.com/mcp`(API キーは任意) | 公式 README で確認 |
| Playwright MCP(Microsoft 公式) | MCP(ローカル) | ブラウザ操作による E2E の再現・デバッグ。アクセシビリティツリーで操作 | `claude mcp add playwright -- npx @playwright/mcp@latest` | 確認 |
| Chrome DevTools MCP(Google 公式) | MCP(ローカル) | 実ブラウザの console / network / DOM / 性能の観測 | `claude mcp add chrome-devtools -- npx chrome-devtools-mcp@latest` | 確認 |
| Vercel MCP | MCP(HTTP, OAuth) | デプロイ状況・ログの確認、Vercel docs 検索 | `claude mcp add --transport http vercel https://mcp.vercel.com` | 公式 docs で確認(ベータ) |
| Supabase MCP(フェーズ 7) | MCP(HTTP, OAuth) | スキーマ確認、SQL、マイグレーション、ログ、docs 検索 | `claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true"` | 確認。既定は read_only で入れる |
| GitHub MCP(公式) | MCP(HTTP) | PR・Issue・CI の参照 | `gh` CLI で大半が足りるため、必要になってから | 任意 |
| Astro Docs MCP | MCP(HTTP) | Astro を採用した場合のみ | `claude mcp add --transport http astro-docs https://mcp.docs.astro.build/mcp` | 確認(推奨案では不使用) |
| Neon MCP | MCP | Neon を採用した場合のみ(`@neondatabase/mcp-server-neon`) | 代替案のみ | 存在を確認 |

運用方針:
- プロジェクト共通の MCP は `.mcp.json` に書いてコミットする(ローカル stdio のもの)。OAuth が要る HTTP のもの(Vercel、Supabase)はユーザースコープに入れる。
- Skills は `npx skills add` で `.agents/skills/` に入り `skills-lock.json` で固定される(流用元と同じ仕組み)。導入したら `CLAUDE.md` の「使う Skills」に一行で用途を書く。
- 公式 MCP の無いライブラリは Context7 でまかない、専用 MCP を探し回らない。
- Lint・型検査・Vitest は CLI 出力で足りるので MCP を足さない。

## 4. 意思決定のための要約

| 領域 | 推奨 | 決め手 |
|---|---|---|
| 言語 | TypeScript / Node 24 / pnpm | 1 言語で全層。zod 型の共有 |
| フロント | Next.js 16 App Router(標準出力、解説は静的生成) | インタラクション中心の要件、認証・進捗のサーバー機能、内蔵 MCP と公式 Skills |
| UI | Tailwind v4 + shadcn/ui | ポップオーバー・シートが揃う。公式 MCP |
| コンテンツ | Velite + remark-wiki-link(+ journal ブロック用プラグイン) | zod 検証と横断検査のフック。MDX 不要 |
| 状態 | 進捗の正本は Supabase。クライアントは React の状態で足りる | ブラウザ保存を正本にしない(architecture.md 3.2) |
| 概念マップ | React Flow + elkjs | 階層レイアウトと操作性 |
| 検索 | なし(配列フィルタ)→ 必要時 Pagefind | 規模が小さい |
| テスト | Vitest / RTL / Playwright | 標準的。Playwright MCP と同じ操作系 |
| Lint | ESLint(next)+ Prettier | 公式設定 |
| CI / ホスティング | GitHub Actions / 未決(β 前に決定) | `standalone` 出力でホスト中立を保つ |
| DB / 認証(MVP から) | Supabase(Postgres, Auth 匿名→本登録, RLS)。supabase-js + 生成型、ORM なし | ゲスト引き継ぎと回答データの蓄積に直結。公式 MCP |

決定(2026-11-07): 1. Next.js、2. Supabase、3. ホスティングは未決(β 前に決定)。

## 出典
- Next.js MCP: https://nextjs.org/docs/app/guides/mcp 、 https://github.com/vercel/next-devtools-mcp
- Vercel Skills: https://playbooks.com/skills/vercel-labs (vercel-labs/agent-skills, vercel-labs/next-skills)
- Astro Docs MCP: https://docs.astro.build/en/guides/build-with-ai
- Supabase MCP: https://mcp.directory/servers/supabase-mcp-server (公式 mcp.supabase.com の説明)
- Context7: https://github.com/upstash/context7
- Playwright MCP: https://glama.ai/mcp/servers/@microsoft/playwright-mcp/blob/main/README.md 、 Chrome DevTools MCP: https://addyosmani.com/blog/devtools-mcp/
- Vercel MCP: https://docs.vercel.com/docs/mcp/vercel-mcp
- Velite: https://github.com/zce/velite 、 https://velite.js.org/guide/define-collections
- Pagefind 多言語: https://pagefind.app/docs/multilingual/
- Neon MCP: https://skillselion.com/skills/neondatabase/ai-rules/neon-drizzle

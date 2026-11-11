# 技術選定(v0.1比較・推奨案)

更新日: 2026-11-07
状態: 比較の記録。決定はADR 0003(採用済み)と`docs/architecture.md`を正とする。決定時に変わった点: 静的エクスポートを前提にしない、SupabaseをMVPから入れる(Auth + 2テーブル)、ORMは入れない、ホスティングは未決。

## 0. 前提(要件から導かれる制約)
- 個人開発。保守対象を少なく、学習コストを低く。
- 初期は無料・ゲストのみ。**MVPはサーバー側の状態を持たない**(静的配信 + ブラウザ内の採点と進捗保存)。
- content as code。Markdown + YAMLをgitで管理し、ビルド時に参照整合性・用語の未説明・前提の循環を検査する。
- 将来: アカウントと同期(フェーズ7)、2級以降・B2B・AI解説(フェーズ8以降)。これらを **妨げない** ことは必要だが、今作らない。
- AIエージェント(Claude Code)との親和性。公式のSkills / MCPがあり、学習データが豊富で、エラーをエージェントが直接観測できること。

## 1. 技術領域と候補の比較

### 1.1 言語・ランタイム
| 候補 | 評価 |
|---|---|
| **TypeScript + Node.js 24 LTS**(推奨) | フロントとコンテンツ処理と将来のサーバーを1言語で書ける。zodの型をコンテンツ・採点・APIで共有できる |
| Python(バックエンドのみ) | MVPにサーバーが無いので出番がない。AI解説を足すときもTypeScriptのSDKで足りる |

パッケージマネージャは **pnpm**(ローカルに11.xあり。厳密な依存解決とディスク効率)。

### 1.2 フロントエンドフレームワーク(最重要の選択)
| 候補 | 長所 | 短所 | 判定 |
|---|---|---|---|
| **Next.js 16(App Router, 静的エクスポート → 将来SSR / Server Actions)** | React一本で解説ページ・演習・ポップオーバー・概念マップ・進捗の状態共有を書ける。将来のアカウント機能も同じアプリに足せる。開発サーバーがMCPエンドポイント(`/_next/mcp`)を内蔵し、エージェントが実行時エラー・ルート・ログを直接読める。Vercel公式のReact / Next.js Skillsがある。学習データが最も多い | フレームワークが大きく、更新が速い。静的コンテンツ中心のサイトとしてはAstroより出力が重い | **推奨** |
| Astro 5 + React islands | Content Collections(zod検証つき)がcontent as codeにそのまま合う。静的出力が軽い。公式Docs MCP(`mcp.docs.astro.build`)がある | 本サービスは「読む」より「操作する」部分が多い(演習、エディタ、全文に散る用語ポップオーバー、ページをまたぐ進捗)。islands間の状態共有(nanostores等)と、将来の認証・同期で設計が二重になる | 次点。コンテンツ閲覧が主体なら逆転する |
| SvelteKit / Nuxt | 軽量で書き味は良い | Reactに比べUIライブラリ・Skills・学習データが薄く、エージェント主導の開発で不利 | 不採用 |
| SPA(Vite + React Router) | 最も単純 | 静的HTMLが出ないので初回表示と検索性(用語集・解説)が弱い。Next.jsの静的エクスポートで同じ単純さが得られる | 不採用 |

**Next.jsを推奨する理由**: 要件の重心が「インタラクティブな学習ループ」にあり、React単一ランタイムの方が状態設計が素直。
さらにフェーズ7でサーバー機能を同じコードベースに足せる。Astroの利点(Content Collections)はVeliteで代替できる(1.4)。

### 1.3 UI(スタイル・コンポーネント)
| 候補 | 評価 |
|---|---|
| **Tailwind CSS v4 + shadcn/ui**(推奨) | Popover / HoverCard / Sheet / Dialog / Tabsが揃い、用語ポップオーバー(PCはホバー、スマホはボトムシート)をすぐ組める。コードをプロジェクトに取り込む方式なので依存の破壊的変更に強い。shadcnは公式MCPを提供(`npx shadcn@latest mcp init`)。エージェントの生成精度が高い |
| MUI / Chakra | 完成度は高いがデザインの自由度とTailwindとの相性で劣る。学習サイトの読み物部分は独自スタイルが要る |
| CSS Modulesのみ | ライブラリ依存は減るが、アクセシブルなポップオーバー・シートを自作することになる |

本文のタイポグラフィは`@tailwindcss/typography`。数式は不要(会計の計算は表と仕訳で表現する)。

### 1.4 コンテンツパイプライン(Markdown / YAML → 型付きデータ)
| 候補 | 評価 |
|---|---|
| **Velite**(推奨) | Markdown / MDX / YAML / JSONをzodスキーマで検証して型付きJSONにする。2026-06にv0.4リリースで保守中。`prepare` / `complete`フックでコレクション横断の検査(用語の未説明、前提の循環、仕訳の貸借一致)を書ける。Next.jsとは`velite build`を`next build`の前段で走らせる(Turbopack既定のためwebpackプラグイン連携は使わない) |
| content-collections | 同系統だが今回の調査で保守状況を確認できなかった |
| Fumadocs(fumadocs-mdx) | ドキュメントサイト向けの完成品。学習サイトのナビゲーションとは構造が違い、剥がす部分が多い |
| 自作(gray-matter + zod + unified) | 依存は最小だが、ウォッチ・キャッシュ・型生成を自分で持つことになる。Veliteが合わなかったときの退路 |

Markdown拡張:
- `[[id|表示語]]`の用語参照は **remark-wiki-link**(別名区切り設定あり)で解釈し、Termコンポーネントに割り当てる。
- ```` ```journal ````ブロックはrehypeの段階で仕訳エディタのコンポーネントに置き換える(小さなプラグインを1つ書く。これは必要な独自実装)。
- MDXは使わない方針を推奨(執筆者がJSXを気にせず済む。必要なコンポーネントは上の2記法で足りる)。必要になればVeliteはMDXも扱える。

### 1.5 状態管理・ブラウザ保存(進捗レコード)
| 候補 | 評価 |
|---|---|
| **Zustand + persist(localStorage)**(推奨) | 進捗レコードを1ストアで持ち、ページをまたいで共有。persistで保存・復元・バージョン移行が標準機能。将来の同期は「ストアの内容をサーバーに送る」だけ |
| React Context + 自作localStorage | 小規模なら足りるが、移行・部分更新・SSR時の水和を自分で扱う |
| IndexedDB(Dexie) | 進捗レコードは数十KB規模なので不要 |

### 1.6 概念マップ
| 候補 | 評価 |
|---|---|
| **React Flow(@xyflow/react)+ elkjs**(推奨) | ノード・エッジの描画、ズーム、クリック、カスタムノードが揃う。自動レイアウトはelkjs(階層レイアウトが前提関係の表現に向く) |
| D3 force | 自由度は高いが実装量が多く、前提関係(方向つき階層)には向かない |
| Cytoscape.js | グラフ解析向き。Reactとの統合がReact Flowより手間 |

### 1.7 検索(用語集)
MVPは用語集200項目程度の部分一致(名前・別名・short)なので **ライブラリなし**(配列のフィルタ)で足りる。
サイト全体の全文検索が必要になったらPagefind(静的サイト向け。日本語は分かち書きのみで活用形の正規化は無い)を検討する。

### 1.8 バックエンド・データベース・認証(フェーズ7で導入。今は「妨げない」だけ)
| 領域 | 推奨 | 代替 | 理由 |
|---|---|---|---|
| DB | **Supabase(Postgres)** | Neon(Postgres)+ 自前API | Auth・DB・Storageが一体で個人開発に向く。公式MCP(`mcp.supabase.com`、`read_only`と`project_ref`で範囲を絞れる、`search_docs`内蔵)。Row Level Securityで学習者ごとのデータ分離をDB側で保証できる |
| ORM | **Drizzle ORM** | Prisma、Supabaseクライアント(PostgREST) | SQLに近く型安全。マイグレーションも持つ。公式MCPは無いがContext7でdocsを引ける |
| 認証 | **Supabase Auth(匿名サインイン → 本登録への昇格)** | Better Auth(anonymousプラグインで同等) | 「ゲストで始めて後からアカウントに引き継ぐ」要件に、匿名ユーザーを恒久ユーザーへ昇格させる機能がそのまま対応する |
| サーバー実行 | Next.js Route Handlers / Server Actions(Vercel) | Supabase Edge Functions | 同一コードベースに留める |

Neon + Better Authはベンダーロックを避けたい場合の構成。機能は満たすが部品が増える。

### 1.9 インフラ・デプロイ
| 候補 | 評価 |
|---|---|
| **Vercel**(推奨) | Next.jsの開発元。プレビューデプロイ、公式MCP(`mcp.vercel.com`、ベータ、ドキュメント検索とデプロイ操作)。Hobbyプランは個人・非商用向けで、無料提供のMVPは該当。商用化時にProへ |
| Cloudflare Pages / Workers(OpenNext) | 無料枠が広く商用でも安い。Next.jsはOpenNextアダプタ経由で制約がある。静的エクスポートの間は問題なし | 商用化時の移行先候補 |
| 自前VPS | 個人開発で運用負荷が見合わない | 不採用 |

静的エクスポートの間はどこにでも置ける。Vercel固有機能(ISR、Image Optimization)に寄りかからない。

### 1.10 テスト
| 層 | 推奨 | 用途 |
|---|---|---|
| 単体 | **Vitest** | 採点エンジン(仕訳の順不同一致、別名解決、影響計算)、コンテンツ検査、進捗ストア |
| コンポーネント | Vitest + React Testing Library | 仕訳エディタ、ポップオーバー、演習フォーム |
| E2E | **Playwright** | 学習ループ(単元を開く → 演習を解く → 進捗が保存される)。Playwright MCPでエージェントが同じ操作を再現できる |
| コンテンツ | Veliteのスキーマ + `complete`フックの検査をテストとして実行 | content-model.md 4章の全検査 |

### 1.11 Lint・Format・CI
- **ESLint(eslint-config-next, flat config)+ Prettier**。Next.js公式設定でNext固有ルールが入る。Biomeは1ツールで速いがNext固有ルールの網羅が劣るため見送り。
- **GitHub Actions**: lint → 型検査 → Vitest → Velite build(コンテンツ検査)→ Playwright。VercelのGit連携でプレビュー。
- GitホスティングはGitHub(`gh` CLIがあり、エージェントがPR・Issueを扱える)。

### 1.12 将来の領域(今は決めない)
- AI解説: Anthropic Claude API + Vercel AI SDK。LangChain系スキルの再導入はこのとき判断(ADR 0001)。
- 監視: Sentry(公式MCPあり)。分析: Vercel AnalyticsまたはUmami。
- メール(認証用): Resend。Supabase AuthのSMTP設定で使う。

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

## 3. Skills・MCPの一覧(推奨スタック向け)

| 名前 | 種別 | 用途 | 導入 | 確認状況 |
|---|---|---|---|---|
| next-devtools-mcp(Vercel公式) | MCP(ローカル) | 起動中のNext.js開発サーバーの実行時エラー・ルート・ログ・コンパイルエラーをエージェントが読む。版に合ったdocs検索 | `claude mcp add next-devtools -- npx -y next-devtools-mcp@latest`(Next.js 16以上、Node 20.19以上) | 公式docsで確認 |
| vercel-labs/agent-skills(react-best-practices) | Skill | React / Next.jsの性能・設計ルール40超をコード生成時に適用 | `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices`(スキル名は要確認) | 公式リポジトリの存在を確認 |
| vercel-labs/next-skills(next-best-practices) | Skill | App Routerのファイル規約、RSC境界、データ取得、メタデータ、エラー処理 | `npx skills add vercel-labs/next-skills` | 同上 |
| shadcn MCP | MCP(ローカル) | コンポーネントの検索・追加をエージェントが正確に行う | `npx shadcn@latest mcp init --client claude` | shadcn公式docsのMCPページで要確認 |
| Context7(Upstash) | MCP(HTTP) | Tailwind v4、Velite、Zustand、React Flow、Drizzleなど公式MCPの無いライブラリの版別docs | `claude mcp add --transport http context7 https://mcp.context7.com/mcp`(APIキーは任意) | 公式READMEで確認 |
| Playwright MCP(Microsoft公式) | MCP(ローカル) | ブラウザ操作によるE2Eの再現・デバッグ。アクセシビリティツリーで操作 | `claude mcp add playwright -- npx @playwright/mcp@latest` | 確認 |
| Chrome DevTools MCP(Google公式) | MCP(ローカル) | 実ブラウザのconsole / network / DOM / 性能の観測 | `claude mcp add chrome-devtools -- npx chrome-devtools-mcp@latest` | 確認 |
| Vercel MCP | MCP(HTTP, OAuth) | デプロイ状況・ログの確認、Vercel docs検索 | `claude mcp add --transport http vercel https://mcp.vercel.com` | 公式docsで確認(ベータ) |
| Supabase MCP(フェーズ7) | MCP(HTTP, OAuth) | スキーマ確認、SQL、マイグレーション、ログ、docs検索 | `claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true"` | 確認。既定はread_onlyで入れる |
| GitHub MCP(公式) | MCP(HTTP) | PR・Issue・CIの参照 | `gh` CLIで大半が足りるため、必要になってから | 任意 |
| Astro Docs MCP | MCP(HTTP) | Astroを採用した場合のみ | `claude mcp add --transport http astro-docs https://mcp.docs.astro.build/mcp` | 確認(推奨案では不使用) |
| Neon MCP | MCP | Neonを採用した場合のみ(`@neondatabase/mcp-server-neon`) | 代替案のみ | 存在を確認 |

運用方針:
- プロジェクト共通のMCPは`.mcp.json`に書いてコミットする(ローカルstdioのもの)。OAuthが要るHTTPのもの(Vercel、Supabase)はユーザースコープに入れる。
- Skillsは`npx skills add`で`.agents/skills/`に入り`skills-lock.json`で固定される(流用元と同じ仕組み)。導入したら`CLAUDE.md`の「使うSkills」に一行で用途を書く。
- 公式MCPの無いライブラリはContext7でまかない、専用MCPを探し回らない。
- Lint・型検査・VitestはCLI出力で足りるのでMCPを足さない。

## 4. 意思決定のための要約

| 領域 | 推奨 | 決め手 |
|---|---|---|
| 言語 | TypeScript / Node 24 / pnpm | 1言語で全層。zod型の共有 |
| フロント | Next.js 16 App Router(標準出力、解説は静的生成) | インタラクション中心の要件、認証・進捗のサーバー機能、内蔵MCPと公式Skills |
| UI | Tailwind v4 + shadcn/ui | ポップオーバー・シートが揃う。公式MCP |
| コンテンツ | Velite + remark-wiki-link(+ journalブロック用プラグイン) | zod検証と横断検査のフック。MDX不要 |
| 状態 | 進捗の正本はSupabase。クライアントはReactの状態で足りる | ブラウザ保存を正本にしない(architecture.md 3.2) |
| 概念マップ | React Flow + elkjs | 階層レイアウトと操作性 |
| 検索 | なし(配列フィルタ)→ 必要時Pagefind | 規模が小さい |
| テスト | Vitest / RTL / Playwright | 標準的。Playwright MCPと同じ操作系 |
| Lint | ESLint(next)+ Prettier | 公式設定 |
| CI / ホスティング | GitHub Actions / 未決(β 前に決定) | `standalone`出力でホスト中立を保つ |
| DB / 認証(MVPから) | Supabase(Postgres, Auth匿名→本登録, RLS)。supabase-js + 生成型、ORMなし | ゲスト引き継ぎと回答データの蓄積に直結。公式MCP |

決定(2026-11-07): 1. Next.js、2. Supabase、3. ホスティングは未決(β 前に決定)。

## 出典
- Next.js MCP: https://nextjs.org/docs/app/guides/mcp、https://github.com/vercel/next-devtools-mcp
- Vercel Skills: https://playbooks.com/skills/vercel-labs (vercel-labs/agent-skills, vercel-labs/next-skills)
- Astro Docs MCP: https://docs.astro.build/en/guides/build-with-ai
- Supabase MCP: https://mcp.directory/servers/supabase-mcp-server (公式mcp.supabase.comの説明)
- Context7: https://github.com/upstash/context7
- Playwright MCP: https://glama.ai/mcp/servers/@microsoft/playwright-mcp/blob/main/README.md、Chrome DevTools MCP: https://addyosmani.com/blog/devtools-mcp/
- Vercel MCP: https://docs.vercel.com/docs/mcp/vercel-mcp
- Velite: https://github.com/zce/velite、https://velite.js.org/guide/define-collections
- Pagefind多言語: https://pagefind.app/docs/multilingual/
- Neon MCP: https://skillselion.com/skills/neondatabase/ai-rules/neon-drizzle

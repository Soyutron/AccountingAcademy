# AccountingAcademy(仮名)

会計を基礎から専門領域まで、原理・概念・構造の理解を軸に体系的に学べる Web サービス。学習体験は Codecademy の learn-by-doing を踏襲する。
ビジョンは `docs/vision.md`、ロードマップは `docs/roadmap.md`、要件は `docs/requirements.md`、学習体験(会計 IDE)は `docs/ide-design.md`、コンテンツ構造は `docs/content-model.md`、構成は `docs/architecture.md`、設計判断の理由は `docs/decisions/`、開発プロセスと現在のフェーズは `README.md` を見る。

## 現在のフェーズ
ロードマップ M1(学習ループの検証。docs/roadmap.md)。スタックは Next.js 16 + Supabase(ADR 0003)。ホスティングは未決なので特定ホストの固有機能に依存しない。
新しい機能や課題の種類は、まず 1 単元で試してから量産する(roadmap.md 1 章)。
Next.js の API は学習データと異なる可能性があるので、書く前に `node_modules/next/dist/docs/` の該当ガイドを読む(AGENTS.md)。

## コマンド
- `pnpm dev`(Velite の監視 + Next.js 開発サーバー)/ `pnpm build` / `pnpm start`
- `pnpm content`(コンテンツ検査。`.velite/` に型付き JSON を出す)/ `pnpm typecheck` / `pnpm lint` / `pnpm test`
- `pnpm db:start` / `pnpm db:stop` / `pnpm db:reset`(Supabase ローカルスタック。Docker が要る。キーは `.env.local` に)
- 開発中の実行時エラーは Next.js の MCP(`.mcp.json` の next-devtools)で読める

## 構成
- `content/`: ステップ型の単元・概念・勘定科目・誤解・学習パス(docs/content-model.md)。`velite.config.ts` がスキーマと横断検査
- `src/lib/accounting.ts`: 5 要素への影響計算。`src/lib/ledger.ts`: 帳簿から財務諸表を組み立てる。`src/lib/grading.ts`: 課題の採点(誤解 ID を返す)。`src/lib/formulas.ts`: 「条件を変える」の式
- `src/components/ide/`: 会計 IDE(`ide-shell.tsx` が状態とステップ進行、各ペインは別ファイル)
- `src/lib/progress.ts`: 匿名サインインと回答・進捗の保存。`supabase/migrations/`: スキーマと RLS
- `src/components/markdown.tsx`: 説明文の描画。`[[id]]` → 用語ポップオーバー、```journal → 仕訳エディタ

## 使う Skills / MCP
- Skills(`.agents/skills/`、`npx skills add` で導入、`skills-lock.json` で固定): vercel-react-best-practices(React / Next.js の性能)、vercel-composition-patterns(コンポーネント設計)、web-design-guidelines(UI レビュー)、supabase / supabase-postgres-best-practices(DB・認証・マイグレーション)。該当する作業の前に読む
- MCP(`.mcp.json`): next-devtools(開発サーバーの実行時エラー・ルート)、shadcn(コンポーネントの検索と追加)、playwright / chrome-devtools(ブラウザでの検証)、context7(Tailwind・Velite などの最新 docs)。Supabase の公式 MCP はクラウドのプロジェクトを作った時点で `read_only` で追加する
- Next.js の API は `node_modules/next/dist/docs/` を正とする(AGENTS.md)

## 守るべき境界
- 知識の正本はテーマ軸(テーマ → 単元 → 概念)。試験固有の情報(範囲、出題形式、配点)は学習パスにだけ持ち、単元や概念に書かない(ADR 0002)。
- 単元の解説は `docs/content-model.md` の 5 節テンプレート(何を学ぶか / なぜ存在するか / 原理 / 処理 / つながり)を省略しない。
- 専門用語は既知と仮定しない。単元で初めて使う概念は `introduces` に挙げて本文で定義と具体例を書き、本文の用語は `[[id]]` で参照する。
- 日商簿記検定の過去問・公式問題は転載しない(日本商工会議所の著作物)。演習問題はすべて自作する。
- 学習者は Supabase Auth のユーザー ID で識別し、ゲストは匿名ユーザーとして扱う。ログイン必須の導線を作らない。匿名サインインは最初の回答時に行い、閲覧だけでユーザーを作らない。
- 採点と解説はコンテンツだけで完結させる(純粋関数)。採点に DB や API を挟まない。
- コンテンツ(解説・演習・概念・誤解)は `content/` で管理し、DB に置かない。
- 不正解は「どの誤解か」まで判定して返す。誤答パターンと誤解 ID を省略した演習を増やさない。
- 実 API(決済・LLM・本番 Supabase)を呼ぶテストを追加しない。Supabase はローカルスタックで検証する。
- 図解はコードで描く(`figure` ブロック)。外部イラストは unDraw のみとし、追加時は `docs/assets-ledger.md` に記録する。いらすとやと AI 生成画像は学習コンテンツに使わない(ADR 0004)。

## Coding Style
- コード内のコメントは日本語で記述してください。
- docstring も日本語で記述してください。
- 変数名、関数名、クラス名は英語で記述してください。
- コンテンツ(解説・演習)は日本語。ID は英語の kebab-case / snake_case。

## 実装方針
- 過剰設計を避け、現在の要件を満たす最小限の実装を優先する。
- 将来必要になるかもしれないという理由だけで、抽象化・汎用化・フォールバック・設定項目・独自ヘルパーを追加しない。
- 既存のライブラリやフレームワークの標準機能で解決できる場合は、独自実装を増やさない。
- 単純な処理は単純なまま保ち、明確な必要性が出てから抽象化する。
- 修正時は対象の問題に必要な範囲だけ変更し、無関係なリファクタリングを同時に行わない。

## コメント
- コードから自明な内容はコメントに書かない。
- コメントは「なぜこの実装なのか」など、コードだけでは分からない情報に限定する。
- 長い説明や設計背景はコメントに書かず、必要に応じてドキュメントへ分離する。
- コメントは簡潔にする。

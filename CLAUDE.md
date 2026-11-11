# AccountingAcademy(仮名)

会計を基礎から専門領域まで、原理・概念・構造の理解を軸に体系的に学べるWebサービス。学習体験はCodecademyのlearn-by-doingを踏襲する。
ビジョンは`docs/vision.md`、ロードマップは`docs/roadmap.md`、要件は`docs/requirements.md`、学習体験(会計IDE)は`docs/ide-design.md`、デザインシステムとテーマは`docs/design-system.md`、コンテンツ構造は`docs/content-model.md`、構成は`docs/architecture.md`、設計判断の理由は`docs/decisions/`、開発プロセスと現在のフェーズは`README.md`を見る。

## 現在のフェーズ
ロードマップM1(学習ループの検証。docs/roadmap.md)。スタックはNext.js 16 + Supabase(ADR 0003)。ホスティングはVPS 1台 + Coolify(ADR 0006)。Dockerで動くstandalone出力を維持し、特定ホストの固有機能に依存しない。
新しい機能や課題の種類は、まず1単元で試してから量産する(roadmap.md 1章)。
Next.jsのAPIは学習データと異なる可能性があるので、書く前に`node_modules/next/dist/docs/`の該当ガイドを読む(AGENTS.md)。

## コマンド
入口は`Makefile`(`make help`で一覧)。実体はpackage.jsonのscriptsと`scripts/*.sh`で、新しいコマンドは原則Makefileに足す。引数は環境変数で渡す(`make monkey MONKEY_UNTIL=22:00`)。
- `make dev`(Veliteの監視 + Next.js開発サーバー)/ `make build` / `make start`
- `make content`(コンテンツ検査。`.velite/`に型付きJSONを出す)/ `make typecheck` / `make lint` / `make test` / `make e2e`(E2E。コンテンツを変えたら必ずローカルで回す。CIでは回さない)
- `make db-start` / `make db-stop` / `make db-reset`(Supabaseローカルスタック。Dockerが要る。キーは`.env.local`に)
- `make check`(lint / 型 / テスト / ビルド / E2Eを一括。E2Eは3100番で本番ビルド。`CHECK_E2E=0`でE2Eを省く)
- 品質改善ループ(docs/quality-loop.md): `make services-up` → `make monkey MONKEY_UNTIL=…`(人格型Monkey)/ `make monkey-scripted`(seed付きMonkey)→ `make triage` → `make issue-loop ISSUE_UNTIL=…`(worktreeで実装・レビュー・mainへ統合)。夜間は`make quality-night QUALITY_UNTIL=06:00`。状況は`make issue-status`
- 開発中の実行時エラーはNext.jsのMCP(`.mcp.json`のnext-devtools)で読める

## 構成
- `content/`: ステップ型の単元・概念・勘定科目・誤解・学習パス(docs/content-model.md)。`velite.config.ts`がスキーマと横断検査
- `src/lib/accounting.ts`: 5要素への影響計算。`src/lib/ledger.ts`: 帳簿から財務諸表を組み立てる。`src/lib/grading.ts`: 課題の採点(誤解IDを返す)。`src/lib/formulas.ts`: 「条件を変える」の式
- `src/components/ide/`: 会計IDE(`ide-shell.tsx`が状態とステップ進行、各ペインは別ファイル。`tutorial-tour.tsx`が操作ツアー、`help-dialog.tsx`が「使い方」、`help-icon.tsx`が機能横の「?」。文言は`src/lib/help-topics.ts`が正本。docs/help-design.md)
- 品質確認はローカルが正(ADR 0005)。`git config core.hooksPath .githooks`でpush前にlint・型・テストが走る。GitHub Actionsは最小の1ジョブだけ
- `src/lib/progress.ts`: 匿名サインインと回答・進捗の保存。`supabase/migrations/`: スキーマとRLS
- `scripts/`: 無人ループ(`monkey-loop.sh` / `triage-agent.sh` / `issue-agent.sh` / `issue-loop.sh` / `issue-verify.sh` / `quality-night.sh`)、`scripts/monkey/session.mjs`(Monkeyのオラクル)、`scripts/issue-agent/`(プロンプトとスキーマ、PreToolUseのguard)。`.claude/skills/monkey-test/`: 人格と手順。`e2e/repro/`: Issueの回帰テスト(`issue-<n>.spec.ts`)。`logs/`はgitignore
- `src/components/markdown.tsx`: 説明文の描画。`[[id]]` → 用語ポップオーバー、```journal → 仕訳エディタ

## 使うSkills / MCP
- Skills(`.agents/skills/`、`npx skills add`で導入、`skills-lock.json`で固定): vercel-react-best-practices(React / Next.jsの性能)、vercel-composition-patterns(コンポーネント設計)、web-design-guidelines(UIレビュー)、supabase / supabase-postgres-best-practices(DB・認証・マイグレーション)。該当する作業の前に読む
- MCP(`.mcp.json`): next-devtools(開発サーバーの実行時エラー・ルート)、shadcn(コンポーネントの検索と追加)、playwright / chrome-devtools(ブラウザでの検証)、context7(Tailwind・Veliteなどの最新docs)。Supabaseの公式MCPはクラウドのプロジェクトを作った時点で`read_only`で追加する
- Next.jsのAPIは`node_modules/next/dist/docs/`を正とする(AGENTS.md)

## 守るべき境界
- 知識の正本はテーマ軸(テーマ → 単元 → 概念)。試験固有の情報(範囲、出題形式、配点)は学習パスにだけ持ち、単元や概念に書かない(ADR 0002)。
- 単元の解説は`docs/content-model.md`の5節テンプレート(何を学ぶか / なぜ存在するか / 原理 / 処理 / つながり)を省略しない。
- 専門用語は既知と仮定しない。単元で初めて使う概念は`introduces`に挙げて本文で定義と具体例を書き、本文の用語は`[[id]]`で参照する。
- 日商簿記検定の過去問・公式問題は転載しない(日本商工会議所の著作物)。教科書・問題集・Web記事の文章も転記しない。演習問題はすべて自作する。コードはApache 2.0、`content/`はCC BY-SA 4.0で公開するので(ADR 0007)、この条件で再配布できないものを持ち込まない。
- 学習者はSupabase AuthのユーザーIDで識別し、ゲストは匿名ユーザーとして扱う。ログイン必須の導線を作らない。匿名サインインは最初の回答時に行い、閲覧だけでユーザーを作らない。
- 採点と解説はコンテンツだけで完結させる(純粋関数)。採点にDBやAPIを挟まない。
- コンテンツ(解説・演習・概念・誤解)は`content/`で管理し、DBに置かない。
- 不正解は「どの誤解か」まで判定して返す。誤答パターンと誤解IDを省略した演習を増やさない。
- 実API(決済・LLM・本番Supabase)を呼ぶテストを追加しない。Supabaseはローカルスタックで検証する。
- 図解はコードで描く(`figure`ブロック)。外部イラストはunDrawのみとし、追加時は`docs/assets-ledger.md`に記録する。いらすとやとAI生成画像は学習コンテンツに使わない(ADR 0004)。

## Coding Style
- コード内のコメントは日本語で記述してください。
- docstringも日本語で記述してください。
- 変数名、関数名、クラス名は英語で記述してください。
- コンテンツ(解説・演習)は日本語。IDは英語のkebab-case / snake_case。

## 文章の表記
コンテンツ、UIの文言、ドキュメント、コメント、コミットメッセージ、Issue・PRのすべてに適用する。
- 日本語と英数字・インラインコードの間に半角スペースを入れない(「PythonでAPIを開発する」「売上高は100万円です」)。
- 残す空白: 英単語どうしの間(Claude Code、Next.js 16)、演算子や区切りの前後(`A / B`、`→`、`×`、`=`)、構文上の空白(```journalの「借方: 現金 2,000」、見出しの節番号「### 3.1 図解」、表や罫線の図)。
- 空白の扱いそのものを試すテスト入力(「5 要素」「30,000 円」)は変えない。
- 人が書いた文章として読めるようにする。定型の前置きやまとめを書かず、具体的な事実と数字で短く言い切る。「〜することができます」は「〜できます」にする。太字、箇条書き、「**ラベル**: 説明」の連打、決まって3つ並べる列挙、「重要」「さまざま」のような中身のない形容に頼らない。

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

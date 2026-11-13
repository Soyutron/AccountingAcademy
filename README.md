# Open簿記

読みは「オープン簿記」、英字表記はOpenBoki。公開先はopenboki.org(準備中)。
会計を基礎から専門領域まで、原理・概念・構造の理解を軸に体系的に学べるWebサービス。
目指すのは「日本の会計教育に、オープンソースの文化を」。誰もが無料で学べ、教材はコミュニティが育てる共有財産にする([docs/vision.md](docs/vision.md))。
学習体験は **会計IDE**: Codecademy(https://www.codecademy.com/)のように、物語と課題・仕訳帳・財務諸表を1画面に置き、
仕訳を記帳すると貸借対照表と損益計算書がその場で動く。
ビジョンと現状のギャップは[docs/vision.md](docs/vision.md)、開発方針とロードマップは[docs/roadmap.md](docs/roadmap.md)、
要件は[docs/requirements.md](docs/requirements.md)、学習体験は[docs/ide-design.md](docs/ide-design.md)、コンテンツ構造は[docs/content-model.md](docs/content-model.md)が正本。

## 開発プロセス

立ち上げ期(フェーズ0〜4)は完了し、以降は[docs/roadmap.md](docs/roadmap.md)のマイルストーン(M1〜M7)で進める。
決めたことは`docs/decisions/`にADRとして残す。下表は立ち上げ期の記録。

| # | フェーズ | 主な成果物 | 出口条件 | 状態 |
|---|---|---|---|---|
| 0 | リポジトリ整理 | 流用元の削除、`CLAUDE.md` / `README.md`の置き換え | Ludogenesis由来のファイルが残っていない | 完了(2026-11-07) |
| 1 | 要件定義 | `docs/requirements.md` | 「未決事項」が空になり、MVPの範囲が確定している | ほぼ完了(未決6件) |
| 2 | コンテンツ設計 | `docs/content-model.md`、3級範囲のテーマ・単元一覧、サンプル1テーマ | 演習形式と執筆テンプレートが3級の全論点を表現できると確認できた | 進行中 |
| 3 | 技術選定 | `docs/tech-stack.md`(比較)、ADR 0003、`docs/architecture.md` | ユーザーがスタックを決定し、ADR 0003が「採用」になっている | 完了(2026-11-07。ホスティングはADR 0006) |
| 4 | 縦スライス | 選定したスタックで1テーマ分(単元・用語ポップオーバー・仕訳エディタ・演習採点と誤解検出・匿名ユーザーでの進捗保存)を動かす。捨てずにMVPの土台にする | 学習ループが成立し、`content-model.md` 8章の検証項目に答えが出ている | 完了(2026-11-07。E2E `e2e/learning-loop.spec.ts`で確認) |
| 5 | MVP実装 | 会計IDE(3ペイン、ステップ型単元、財務諸表のリアルタイム更新、誤りの視覚化)・3級パス・用語集・匿名ユーザーの進捗 | 3級パスを1本通しで学習できる | ロードマップM1〜M4に引き継ぎ(2026-11-07時点で13単元) |
| 6 | コンテンツ量産・β検証 | 3級全範囲 + 深掘り2〜3テーマ、ホスティング決定、プライバシーポリシー、テスター10名の検証 | 要件6.2の検証結果が出て、教育方針の有効性を判断できた | 未着手 |
| 7 | 本登録 | メール / Googleでの本登録(匿名ユーザーの昇格)、プロフィール | 匿名 → 本登録で履歴が引き継がれる | 未着手 |
| 8 | 公開・拡張 | 2級パス、深さ3〜4の単元、模擬試験 | 継続的な運用に入る | 未着手 |

フェーズ2と4は並行してよい。演習形式と用語の仕組み(2)は縦スライス(4)で検証して固める。
技術選定(3)を縦スライスの前に置いたのは、選定済みのスタックで書けば縦スライスを捨てずに済むため。

### 日々の進め方(Issueを作業単位の正とする)

方向はdocsが持ち、作業単位はGitHub Issuesが持ち、実行は誰がやっても同じ関門を通る。

| 層 | 置き場所 | 決める人 | 内容 |
|---|---|---|---|
| 方向 | `docs/roadmap.md`、vision、requirements、ADR | 人 | マイルストーン、何を検証するか、設計判断 |
| 作業単位 | GitHub Issues | 人が切る(不具合はMonkeyが起票) | 1単元、1機能のスライス、1不具合。受け入れ条件つき |
| 実行 | worktree → `scripts/check.sh` → `main` | 人のセッション、並列セッション、夜間ループのどれでも | 同じ関門(lint / 型 / テスト / ビルド / E2E)を通す |

流れ:

1. マイルストーンの着手時に、roadmapの項目をIssueに分解する。1 Issueは1セッションか1晩で終わる大きさにし、受け入れ条件を本文に書く。
2. ラベルを付ける。種別は`type:bug` / `type:feature` / `type:content`。担当は`ready-for-agent`(Agent Briefつきで無人可)か`ready-for-human`(判断が要る)。不具合だけ`needs-triage`から始め、`triage-agent.sh`が再現して振り分ける。
3. 実行する。人はClaude Codeのセッション(VS Codeのタブ)ごとにIssueを1つ取り、worktreeで進める。夜は`scripts/issue-loop.sh`が`ready-for-agent`を古い順に処理する。取ったIssueには`agent:in-progress`を付け、人とループが衝突しないようにする。
4. コミットの`Closes #n`で閉じる。翌晩のMonkeyと`scripts/issue-verify.sh`が回帰を拾う。
5. マイルストーンの項目が全部閉じたらroadmapにチェックを入れる。

誰が何を取るか:

- 人のセッション: 新しい種類の最初の1件(roadmap 1章「1単元で試してから量産」)、UIデザインや解説方針の判断、スキーマやマイグレーションが絡むもの。
- 並列セッション: 仕様が固まっていて、触る場所が互いに重ならないもの。各セッションで「worktreeで作業して」と頼むと`.claude/worktrees/<name>`に移る。`.env.local`はgitignoreなので`.worktreeinclude`で写し、依存は`pnpm install --frozen-lockfile && pnpm content`を各worktreeで入れる。開発サーバーは3000番が衝突するので2本目はポートを変える。Supabaseローカルスタックは共有なので`pnpm db:reset`は1セッションに限る。
- 夜間ループ: 型が決まった量産(2単元目以降)と再現済みの不具合。実装側は質問できないので、Briefが曖昧なものは`agent:needs-human`で戻る。現状の関門は`issue-<n>`を名前に含むテストを必須にしている。

Issueにしないもの: 設計の検討や試行錯誤(結論だけADRかdocsに書く)、その場で数分で直せる修正(コミットメッセージで足りる)。

人に残る動き: 朝に夜間ループのログと`agent:needs-human`を見て判断する。日中は判断が要るIssueと「最初の1件」を進め、独立なIssueを並列タブで回す。夕方に翌晩へ流すIssueのBriefを書いて`ready-for-agent`を付け、ループを起動する(詳細は[docs/quality-loop.md](docs/quality-loop.md))。

## 貢献とライセンス

貢献の仕方は[CONTRIBUTING.md](CONTRIBUTING.md)、行動規範は[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。
コードは[Apache License 2.0](LICENSE)、`content/`以下の教材は[CC BY-SA 4.0](content/LICENSE)で公開する(ADR 0007)。貢献はDCO(`git commit -s`)で受け付ける。
名称「Open簿記」「オープン簿記」「OpenBoki」とロゴは商標として扱い、どちらのライセンスの対象にも含めない。フォークは自由だが、同じ名前でサービスを名乗ることはできない。

## 開発環境

コマンドの入口は`Makefile`(`make help`で一覧と用途を表示)。実体はpackage.jsonのscriptsと`scripts/*.sh`で、新しいコマンドは原則Makefileに足す。

```bash
make setup       # pnpm install + git hookの有効化(push前にlint・型・単体テストが走る。ADR 0005)
make db-start    # Supabaseローカルスタック(Docker)。出力されたキーを .env.localに書く(.env.example参照)
make dev         # http://localhost:3000
make test        # 採点エンジンなどの単体テスト
make content     # コンテンツ検査だけ実行
make e2e         # E2E(開発サーバーとローカルSupabaseを使う。コンテンツを読んで全単元を自動で解く)
make check       # lint / 型 / テスト / ビルド / E2Eを一括(統合前の関門)
```

品質確認はローカルで完結させる(ADR 0005)。E2E(`make e2e`)はコンテンツやUIを変えたときにローカルで回す。GitHub Actionsはlint・型・単体テスト・ビルドの1ジョブ(約45秒)だけ。

不具合の発見から修正までを無人で回す品質改善ループ(Monkeyテスト → Issue → 自動トリアージ → 修正 → 再検証)は`docs/quality-loop.md`。

```bash
make services-up                                   # Supabase + pnpm dev
make monkey MONKEY_UNTIL=23:00 MONKEY_PARALLEL=3   # 人格型Monkey(Claude Codeが学習者として操作し、再現したものを起票。3人格まで同時)
make monkey-scripted                               # seed付きMonkey(所見が出たseedだけClaudeが再現・起票)
make triage                                        # needs-triageを再現して振り分け(ISSUE=<n> で1件)
make issue-loop ISSUE_UNTIL=06:00                  # ready-for-agentをworktreeで実装 → レビュー → mainへ統合 → push
make quality-night QUALITY_UNTIL=06:00             # 上の3つを順に(夜間)
make issue-status                                  # 処理中のIssueと残っているworktree
```

## ディレクトリ

```
docs/vision.md          プロダクトビジョン(オープンソースの文化)、会計ならではの学び方、貢献者への階段、現状とのギャップ
docs/roadmap.md         開発方針とマイルストーン
docs/requirements.md    要件定義(正本)
docs/ide-design.md      会計IDEの画面構成・ステップの種類・学習フロー
docs/help-design.md     ヘルプとチュートリアルの層(機能ヘルプ / 初出の案内 / 使い方 / ツアー)
docs/visual-guidelines.md図解・イラスト・アニメーションの方針と図解ブロックの仕様
docs/assets-ledger.md   外部素材の台帳
docs/testing-guide.md   自分でテストするときの見るポイントと指標の集計SQL
docs/quality-loop.md    品質改善ループ(Monkey → Issue → トリアージ → 修正 → 再検証)の設計と運用
docs/content-model.md   コンテンツ構造・記述形式・ステップの課題・用語集
docs/tech-stack.md      技術選定の比較(記録)、Skills / MCP一覧
docs/architecture.md    採用した構成、責務の配置、データモデル、誤解検出の仕組み
docs/decisions/         ADR(設計判断の理由)
content/                学習コンテンツ(Markdown + YAML)。velite.config.tsで検査
src/                    Next.jsアプリ(app: ページ、components: UI、lib: 採点・会計計算・進捗保存)
supabase/               ローカルスタック設定とマイグレーション
Makefile                コマンドの入口(make help)
scripts/                無人ループ(Monkey、トリアージ、issue-agent)と品質確認(check.sh)
e2e/                    E2E(学習ループ、チュートリアル、seed付きMonkey、repro/ にIssueの回帰テスト)
```

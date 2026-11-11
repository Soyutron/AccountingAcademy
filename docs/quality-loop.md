# 品質改善ループ(Monkeyテスト → Issue → 修正 → 再検証)の設計案

TaxForge(`~/Projects/taxforge`)で運用している「人格型Monkeyテスト」と「Issue駆動の無人修正ループ」を調査し、
AccountingAcademyに移植した。§1〜§3は調査の記録、§4以降が設計、§8が実装したものと使い方。

## 0. 結論

| 観点 | 判断 |
| --- | --- |
| 再利用 | TaxForgeの4本のシェル(`monkey-loop` / `issue-agent` / `issue-loop` / `claude-usage-limit`)と、プロンプト6本・スキーマ4本は **ほぼそのまま移植できる**。LLMスタブ・LangGraph・認証まわりの前提は本プロジェクトに無く、むしろ構成が軽くなる |
| 構成 | 探索(Monkey)→ 起票 → **自動トリアージ(新設)** → 修正(worktreeで実装、別モデルがレビュー、関門はスクリプト)→ 統合 → **再検証(新設)** の5段を、ローカルから手動起動するシェルで回す。GitHub Actionsは使わない(ADR 0005) |
| 人手 | 残すのは3点だけ。(1)夜間ループの起動と翌朝のログ確認、(2) `ready-for-human` / `agent:needs-human`が付いたIssueの判断、(3) UIデザインやコンテンツ方針に関わる修正の採否 |
| 本プロジェクト固有 | 不具合の半分は「コンテンツ」(解説・採点・誤解判定)に出ると見込む。Monkeyに **コンテンツ監査の人格** を置き、オラクルに **貸借一致・採点の整合** を入れる。E2Eが24秒で回るので、修正の関門にE2Eを毎回含められる(TaxForgeでは重くて外していた) |
| 費用の目安 | TaxForge実績: 修正1件$1.5〜18(中央値$4前後)、5〜35分。Monkey 1セッション(20 step)約40分。サブスクリプション認証なら利用上限の枠に吸収される |

## 1. TaxForgeの仕組み(調査結果)

### 1.1 構成要素

| 要素 | 場所 | 役割 |
| --- | --- | --- |
| 設計書 | `docs/design/monkey-e2e.md`(§9が運用設計)、`docs/design/issue-agent.md` | 調査と設計判断の記録 |
| Monkeyスキル | `.claude/skills/monkey-test/SKILL.md` + `personas/*.md`(12人格) | Claude CodeがPlaywright MCPでテスター人格として操作する手順。前提確認、状態判定表、異常判定表、禁止事項、人格ごとの「癖」(重み付き操作候補10個) |
| 無人ループ | `scripts/monkey-loop.sh`(約110行) | 終了時刻まで人格をランダムに選んで`claude -p`を反復。stopファイル、3連続失敗で停止、利用上限はリセットまで待機 |
| 環境起動 | `scripts/monkey-services.sh` | Supabase / スタブ / LangGraph / Nextをまとめてup / down / status |
| 利用上限 | `scripts/claude-usage-limit.sh` | ログの文言で上限を検知し、10分ごとにhaikuへ疎通して解除を待つ |
| Issue修正 | `scripts/issue-agent.sh`(約330行)+ `scripts/issue-agent/*.md`(work / gate / review / recheck / fix / plan)+ `*.schema.json` | 1 IssueをworktreeでOpusが調査・計画・実装 → スクリプトの関門(未コミット無し・差分あり・保護パス・`make check`)→ Fableが読み取り専用でレビュー(`must`があれば差し戻し、最大2ラウンド)→ `feature`へ`--no-ff`マージ → push。ラベル`agent:in-progress` / `agent:done` / `agent:needs-human`で状態を持つ |
| Issueループ | `scripts/issue-loop.sh` | `ready-for-agent`のIssueを古い順に`issue-agent.sh`へ渡す。終了コードで継続可否を決める(環境の問題だけ停止) |
| トリアージ | `.claude/skills/triage/`(人が`/triage`で起動) | `needs-triage` → `ready-for-agent`へ。Agent Briefを書く。**ここは人手** |
| ラベル語彙 | `docs/agents/triage-labels.md`、`make issue-labels` | needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix + `agent:*` |

### 1.2 実績

- Monkey: セッション141回(2026-09-08〜09-16)。起票はIssue #41〜#187のうち大半。1セッションあたり新規0〜2件、既存Issueへのコメント0〜1件。「未再現」は履歴に残すだけという運用が機能している(誤検知でIssueが汚れていない)。
- issue-agent: 40件処理、37件統合、3件は`needs_human`(再現しない・マイグレーション要)。レビューは1ラウンドで承認が7割。
- 見つかった不具合の型は「タイミング × 状態遷移」(二重送信、reload復元、タブ間伝播、権限変更の反映)と「境界値」(0バイト、20 MiB、2万文字、日本語キー)が多い。

### 1.3 TaxForgeで観察できた課題(移植時に直す)

| 課題 | 対応 |
| --- | --- |
| Playwright MCPは1ツール呼び出しが数秒で、1 step約2分。20 stepで40分 | 操作は **ClaudeがPlaywrightスクリプト(Node)を書いてBashで実行** する方式を主にし、MCPは観察・試行用に併用する。再現スクリプトが成果物として残り、そのまま回帰テストの種になる |
| MCPはスクリーンショットをローカルに残さない | スクリプト方式なら`page.screenshot()`とtraceが残る |
| 反復の残り時間が6分しか無く、環境確認もせず空振りした回がある | ループ側で「残りが1反復の見込み所要時間未満なら始めない」を必須にする(issue-loopには既にある) |
| トリアージが人手 | 読み取り専用の`triage-agent`(§4.3)を新設し、再現できたものだけ`ready-for-agent`にする |
| `Bash(git push:*)`の前方一致は`cd x && git push`を素通りする | 最初からPreToolUseフックでBashの文字列を検査する(`--settings`で無人セッションだけに適用) |
| `feature`と`main`の2本運用が前提 | 本プロジェクトは`main`一本。統合先を`main`にし、pushの`Closes #n`でIssueが閉じる |

## 2. 再利用できる部分

| 区分 | 対象 | 扱い |
| --- | --- | --- |
| そのまま | `claude-usage-limit.sh`、`issue-loop.sh`(変数名のみ)、`issue-agent/*.schema.json`、`fix.md`、`gate.md`、`recheck.md` | コピー |
| 書き換え | `issue-agent.sh`(`feature`→`main`、`make check`→`pnpm`のチェック群、`uv sync`削除、保護パス、禁止ツール)、`work.md` / `review.md`(読むべきdocs、回帰テストの必須化)、`monkey-loop.sh`(環境起動、人格一覧、残り時間の下限)、`monkey-services.sh`(SupabaseとNextだけ) | 移植 |
| 新規 | `monkey-test`スキル本体と人格(本プロジェクトの画面と学習者に合わせる)、オラクル、`triage-agent.sh`、`issue-verify.sh`、Issue本文のテンプレート、既知の挙動リスト | 書く |
| 不要 | OpenAIスタブ、`langgraph.e2e.json`、偽R2、検証ユーザー表、レート制限の禁止事項、`ollama`切替 | 持ち込まない |

## 3. 本プロジェクトとの前提の違い

| 項目 | TaxForge | AccountingAcademy | 影響 |
| --- | --- | --- | --- |
| 外部LLM | 製品がOpenAIを呼ぶ(スタブ必須) | 無し | 環境はSupabaseローカル + `pnpm dev`だけ |
| 認証 | メール + パスワード、組織、ロール | 匿名サインイン(最初の回答時) | 検証ユーザー不要。セッションごとに新しいブラウザコンテキストで「新規ゲスト」になる。レート制限の心配が無い |
| ブランチ | `feature` → `main` | `main`一本 | worktreeは`main`起点、統合先も`main` |
| チェック | `make check`(lint / type / pytest / Vitest) | `pnpm lint` / `typecheck` / `test` / `build` / `playwright test`(計2分弱) | 関門にE2Eを毎回含める |
| 不具合の所在 | UIの状態遷移、権限 | UIに加えて **コンテンツ**(解説、採点、誤解判定、用語参照、図) | コンテンツ監査の人格とオラクルを足す |
| 既存のE2E | 無し(Storybookのみ) | `e2e/learning-loop.spec.ts`が全単元を正解で通す | 「正解を入れたのに不正解」のオラクルにそのまま使える。`fillEntry`等のヘルパーをスクリプト型Monkeyで共用 |
| ビルド | Make | pnpm scripts + Makefile | 当初は`scripts/*.sh`を直接呼んでいたが、2026-11にコマンドの入口をMakefileに集約した(`make help`)。実体は引き続き`scripts/*.sh` |

## 4. 提案する構成

```
scripts/services.sh up|status|down        Supabaseローカル + pnpm dev
scripts/monkey-loop.sh  (MONKEY_UNTIL)    ① 探索: 人格を選んでclaude -p → 再現 → 起票(needs-triage)
scripts/triage-agent.sh <n> / triage-loop ② 自動トリアージ: 再現スクリプトをmainで実行 → ready-for-agent / needs-info / ready-for-human
scripts/issue-agent.sh  <n> / issue-loop  ③ 修正: worktreeで実装 → 関門 → レビュー → mainへ --no-ffマージ → push(Closes #nで閉じる)
scripts/issue-verify.sh <n>               ④ 再検証: 閉じたIssueの再現スクリプトをmainで再実行 → 検証済みコメントor reopen
                                          ⑤ 継続: 翌晩の ① が自然に回帰を拾う
```

### 4.1 ① 探索(Monkey)

2系統を持つ。先にAを作り、Aで「効く壊し方」が分かってからBに移す(TaxForgeと同じ順)。

**A. 人格型(Claude Codeが操作)**: UXの問題(分かりにくい、迷う、誤解を招く文言)はこれでしか見つからない。

- 起動: `claude -p`で`monkey-test`スキルを1人格ぶん。`--allowedTools "Bash,Read,Write,Edit,Skill,mcp__playwright"`、`--permission-mode acceptEdits`。
- 操作: 原則 **Playwrightスクリプトを書いて実行**(`node scripts/monkey/run.mjs`のような薄いランナーに、人格の判断で書いた操作を渡す)。スクリーンショットとtraceを`logs/monkey/<session>/`に残す。MCPの`browser_snapshot`は「いま何が見えているか」を読むために使う。
- 人格(初期7本。学習者として自然で、かつ壊し方が異なるもの):

| 人格 | 狙い |
| --- | --- |
| 初めての学習者 | チュートリアルを途中で閉じる・スキップ・やり直す。バナーの出方。「使い方」から再開。何をすればいいか分からず止まる箇所を記録(UX) |
| せっかちな学習者 | 連打、入力途中で記帳、途中でreload・戻る・別単元へ移動、再開時の状態復元 |
| 間違えまくる学習者 | 空欄、0、負数、全角数字、桁区切り、科目名の別名・誤字・前方一致、貸借逆、行の追加と削除の繰り返し、誤解フィードバックが出るか・文言が適切か |
| スマホで学ぶ学習者 | 390×844。3ペインの折りたたみ、横はみ出し、ポップオーバーの位置、フライングアニメーションの崩れ、1024px境界のresize |
| 用語を全部触る学習者 | すべての`[[id]]`ポップオーバー、用語集、ポップオーバー内の用語の連鎖、Esc・外側クリック、キーボードだけで操作 |
| タブとデータをいじる学習者 | 同じ単元を2タブ、localStorage・Cookie削除、匿名ユーザーの切替、進捗の保存と競合、`?tour=1`などのURL直打ち |
| コンテンツ監査者 | 単元を1つ選び、解説の5節が揃っているか、数字が本文・図・採点で一致するか、正解を入れて正解になるか、誤答に対する誤解IDの説明が当たっているか、図の表示崩れ |

- オラクル(これに当たったら記録。文面の一致ではなく不変条件で判定):

| 検知 | 手段 |
| --- | --- |
| 未捕捉例外、`console.error`、hydrationエラー | `page.on("pageerror")` / `page.on("console")`(Playwrightのキャレット非表示由来の警告は除外) |
| 5xx、`requestfailed`、匿名サインイン後のSupabase 401 / 403 | `page.on("response")` |
| エラー境界、「次へ」が条件を満たしても有効にならない、ツアーが進めない | DOM |
| **貸借不一致の表示**: 結果ペインの合計が記帳済み仕訳の合計と合わない | DOMの数値を`src/lib/ledger.ts`と同じ計算で突合 |
| **採点の整合**: `.velite/units.json`の正解を入れて不正解、または誤答の定義済みパターンに誤解IDが付かない | E2Eソルバーと同じ経路 |
| reload・再訪で進捗(ステップ、記帳済み仕訳)が戻る、`unit_progress` / `attempts`に行が増えない | ローカルSupabaseを`psql`で確認 |
| 390pxで横スクロールが出る、フォーカスが消える、ポップオーバーが画面外 | `document.documentElement.scrollWidth`、`document.activeElement` |

- 終了処理: 異常を1回再現し、再現したものだけ起票。`gh issue list --state open --label bug`で重複確認。既知の挙動(`.claude/skills/monkey-test/known.md`)は起票しない。

**B. スクリプト型(seed付きPRNG)**: LLM費用0で夜間に数百seed。`e2e/monkey.spec.ts`としてPlaywright testに載せ、`fillEntry`などの既存ヘルパーを共用する。actionは15〜25個(単元へ移動、ランダムな科目と金額を入れる、記帳、次へ、戻る、reload、時系列スライダー、タブ切替、用語クリック、resize)。失敗時はseedと操作列を出力し、同じseedで再現できる。オラクルはAと共通のモジュールにする。

### 4.2 起票(Issue)

Monkeyが`gh issue create`で作る。本文のテンプレート(TaxForgeの #187の形を踏襲し、再現スクリプトを足す):

```
## 現象
## 再現手順(番号付き。URL、入力値、操作)
## 期待 / 実際
## 実測(日時、回数x/y、console・networkの抜粋、DBの行)
## 影響と優先度(p1: 学習が進められない / p2: 誤った理解を招く・保存されない / p3: 見た目・文言)
## 証拠(スクリーンショットとtraceのパス。logs/monkey/<session>/)
## 再現スクリプト(e2e/repro/issue-<n>.spec.tsに置けるPlaywrightのtest 1本)
---
Monkeyテスト(人格: …)で検出。操作履歴: logs/monkey/<session>/history.md
```

ラベル: `bug` + `needs-triage` + `p1`〜`p3` + 領域(`area:ide` / `area:content` / `area:progress` / `area:ui`)。
スクリーンショットは`gh`ではIssueに添付できないので、初期はローカルパスの参照に留める。必要になったら
orphanブランチ`evidence`にpushして`blob/evidence/...?raw=true`でリンクする(private repoなのでログイン中の本人だけ見える)。

### 4.3 ② 自動トリアージ(新設。TaxForgeでは人手)

`scripts/triage-agent.sh <n>`: 読み取り専用の`claude -p --model opus --tools "Read,Grep,Glob,Bash"`が、(2026-11-09にfableから変更。1件$2.3前後でFableの枠を最も使っていたため。`TRIAGE_MODEL`で変えられる)

1. Issueを読み、再現スクリプトを`main`の最新で実行する(スクリプトが無ければ手順から書く)。
2. 再現した → 原因の当たりと触るファイルを「Agent Brief」コメントに書き、`ready-for-agent`を付ける。
3. 再現しない → `needs-info`を付け、試した条件をコメントする(次のMonkeyが同じ現象を見たら追記する)。
4. 設計判断・UIデザイン・コンテンツの方針(例: 誤解の説明文の方針、図の意味)が要る → `ready-for-human`。
5. 既存Issueと同じ → `duplicate`を付けて閉じ、元のIssueにコメント。

`triage-loop.sh`が`needs-triage`を古い順に処理する。これにより、人が見るのは`ready-for-human`だけになる。

### 4.4 ③ 修正(issue-agentの移植)

TaxForgeの流れをそのまま使い、次の点を変える。

| 項目 | TaxForge | 本プロジェクト |
| --- | --- | --- |
| 起点・統合先 | `feature` | `main`(pushで`Closes #n`が効き、Issueは自動で閉じる) |
| 依存の導入 | `uv sync` + `pnpm install` | `pnpm install --frozen-lockfile`と`.env.local`のコピーのみ |
| 関門 | `make check` | `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm exec playwright test`(約2分。E2Eは`pnpm dev`を再利用せずworktree内で`pnpm start`を3001などで起こす) |
| 回帰テストの必須化 | 推奨 | **必須**。Issueの再現スクリプトを`e2e/repro/issue-<n>.spec.ts`かVitestに昇格させ、修正前に失敗・修正後に成功することを`work.md`で求める。レビューは「振る舞いを変えたのにテストが無い」を`must`にする(既存と同じ) |
| 保護パス | migrations、`.github`、`Makefile`、`scripts/issue-*`、`.env` | `supabase/migrations/`、`.github/`、`.githooks/`、`scripts/`、`.claude/`、`Makefile`、`velite.config.ts`のスキーマ変更、`.env*`。`content/`は **許可**(コンテンツの不具合が主戦場) |
| 禁止ツール | TaxForgeのMCP群 | `mcp__next-devtools`以外のMCP、`Bash(supabase:*)`、`Bash(gh issue edit|close:*)`、gitのpush / merge / checkout / worktree。加えてPreToolUseフックで`git push`を含むBash文字列を拒否 |
| モデル | 実装opus / レビューfable | 同じ(実績あり) |
| 統合モード | 直統合 | `ISSUE_MODE=merge`(既定)と`ISSUE_MODE=pr`(`gh pr create`で止める)。**導入初期は`pr`で5件ほど人が見てから`merge`に切り替える**(TaxForge §8と同じ段階導入) |

コンテンツの修正で注意する境界(CLAUDE.md): 誤解IDを省略しない、試験固有の情報を単元に書かない、5節テンプレートを省略しない。`review.md`のStandardsにこの3点を明記する。

### 4.5 ④ 再検証(新設)

`scripts/issue-verify.sh <n>`: 統合後に`main`でIssueの再現スクリプト(= 昇格した回帰テスト)を単体で実行する。
通れば「検証済み: <コミット>」とコメントし閉じたまま、落ちればreopenして`agent:needs-human`。
issue-agentの後片付けから呼ぶので、人は何もしない。回帰テストが関門にも入っているため二重だが、
「関門はworktree、再検証は統合後の`main`」という違いがあり、マージ順序由来の回帰を拾える。

### 4.6 ⑤ 継続

夜間に1本のシェル(`scripts/quality-night.sh UNTIL=06:00`)で ① → ② → ③ を順に走らせる。
①の時間配分は`MONKEY_UNTIL`、残りを ②③ に回す。朝は`scripts/issue-agent.sh status`と`logs/`を見る。
Monkeyの人格は「前回起票した領域を避ける」ような賢さは持たせず、ランダムで足りる(TaxForgeで十分だった)。

## 5. 安全策

| 対象 | 手段 |
| --- | --- |
| `main`の誤変更 | worktree内で作業し、`main`は本体がチェックアウト済み(gitが切り替えを拒否する)。統合はスクリプトだけ |
| 本番環境 | 本番Supabaseは未作成。作った後も`.env.local`はローカルのキーしか持たせず、`supabase link`をしない |
| 暴走 | `timeout`、`--max-turns`、`--max-budget-usd`、ラウンド上限2、ループは終了時刻と3連続失敗で停止 |
| レビュアーの改変 | 編集ツール無し + 前後のHEADと作業ツリーの比較 |
| MonkeyのDB汚染 | ローカルSupabaseだけ。匿名ユーザーは90日で消えるが、夜間に数百人増えるので`pnpm db:reset`を週1で回す |
| 記録 | 判定材料(計画・指摘・関門の出力・再現スクリプト)を`logs/`(gitignore)とIssueコメントに残す |

## 6. 導入の順番(各段階で1回動かしてから次へ)

1. **土台(半日)**: ラベル作成スクリプト、Issue本文テンプレート、`scripts/services.sh`、`claude-usage-limit.sh`のコピー、`docs/`とCLAUDE.mdの追記。
2. **人格型Monkey(1日)**: スキル本体、オラクルのPlaywrightモジュール(`scripts/monkey/oracle.mjs`)、人格7本、`known.md`、`monkey-loop.sh`。対話で2人格を回してIssueの質を見る。
3. **issue-agent(1日)**: 移植と関門の書き換え、PreToolUseフック、`ISSUE_MODE=pr`で5件。レビューのJSONを読んで`must`の閾値を確認し、`merge`に切り替える。
4. **triage-agentとissue-verify(半日)**: 再現スクリプトの実行とラベル付け。
5. **スクリプト型Monkey(1日)**: `e2e/monkey.spec.ts`。actionは段階2で効いた操作から選ぶ。
6. **夜間運用**: `quality-night.sh`。1週間回して、起票の精度(再現率、重複率、`needs-human`率)と費用を計測し、人格とオラクルを調整する。

## 7. 未確認事項

- `--max-budget-usd`がサブスクリプション認証で効くか(TaxForgeでも未確認)。
- worktree内でE2Eを回すときのポート(3000は`pnpm dev`が使う)。`playwright.config.ts`の`baseURL`とポートを環境変数化する必要がある。
- `claude -p`からPlaywrightスクリプトを実行する方式で、1 stepあたりの所要時間がどれだけ縮むか(MCPの2分 / stepとの比較)。
- 匿名ユーザーが夜間に増えたときの`pg_cron`の削除負荷(90日後に一括で来る)。

## 8. 実装と使い方(2026-11-07)

| 段 | 実装 | 起動 |
| --- | --- | --- |
| 環境 | `scripts/services.sh`(Supabase + `pnpm dev`)、`scripts/labels.sh`(ラベル作成、初回のみ) | `scripts/services.sh up` |
| ① 探索A(人格型) | `.claude/skills/monkey-test/`(SKILL、人格7本、`issue-template.md`、`known.md`)、`scripts/monkey/session.mjs`(オラクル・スクリーンショット・DB参照・仕訳入力)、`scripts/monkey-loop.sh` | `MONKEY_UNTIL=23:00 scripts/monkey-loop.sh`。対話なら`/monkey-test <人格> [step]` |
| ① 探索B(seed付き) | `e2e/monkey.spec.ts`(状態に応じた22 action、seedで再現)、`scripts/monkey-scripted.sh`(複数seed → 所見があればClaudeが`/monkey-test scripted <seed>`で再現・起票) | `scripts/monkey-scripted.sh` / `MONKEY=1 MONKEY_SEED=7 pnpm exec playwright test e2e/monkey.spec.ts` |
| ② トリアージ | `scripts/triage-agent.sh` + `scripts/issue-agent/triage.md`(読み取り専用。`main`で再現 → Agent Brief → `ready-for-agent` / `ready-for-human` / `needs-info` / `duplicate` / `wontfix`) | `scripts/triage-agent.sh <n>` / `loop` |
| ③ 修正 | `scripts/issue-agent.sh`、`scripts/issue-loop.sh`、`scripts/issue-agent/{work,gate,review,recheck,fix}.md` + スキーマ、`scripts/issue-agent/guard.sh`(PreToolUseでBashの文字列を検査)、`scripts/check.sh`(関門。E2Eは3100番で本番ビルド) | `scripts/issue-agent.sh <n>` / `ISSUE_UNTIL=06:00 scripts/issue-loop.sh` |
| ④ 再検証 | `scripts/issue-verify.sh`(統合後の`main`で`issue-<n>`を名前に含むテストを実行 → `agent:verified`かreopen) | issue-agentの最後に自動。手でも可 |
| ⑤ 継続 | `scripts/quality-night.sh`(seed付きMonkey → 人格型Monkey → トリアージ → 修正) | `QUALITY_UNTIL=06:00 scripts/quality-night.sh` |

- ログは`logs/`(gitignore): `logs/monkey/<日時>-<人格>/`(history.md、step-NN.mjs、shots/、oracle.jsonl、trace)、`logs/monkey-scripted/<seed>.log`、`logs/triage/<n>/`、`logs/issue-agent/<n>/`。
- 人格型Monkeyは`MONKEY_PARALLEL=3`で3人格まで同時に走らせられる(人格ごとに別ブラウザ。同じ人格は同時に走らない。起票直前の重複確認を人格側にも求めている)。
- issue-loopは`ISSUE_PARALLEL=3`で3件まで同時に処理できる(2026-11-08)。ロックはIssueごと、関門のE2Eはワーカーごとのポート(3100 + 枠番号)、
  mainへの統合(取り込み → 関門 → マージ → push → 再検証)だけ`logs/issue-agent/lock`で1件ずつ。同じファイルを触るIssueを同時に進めると統合時にコンフリクトしてneeds-humanに落ちるので、areaが異なる組み合わせが向く。
- 状況の確認は`scripts/issue-agent.sh status`。止めるのは`scripts/monkey-loop.sh stop` / `scripts/issue-loop.sh stop`。
- 人が見るもの: `ready-for-human`と`agent:needs-human`のIssue(`gh issue list --label ready-for-human,agent:needs-human`)、
  統合後のIssueコメント(残ったshould / nit)、週1回の`pnpm db:reset`(夜間に匿名ユーザーが増えるため)。
- 初回の実測(2026-11-07、1サイクル): 人格型Monkey(impatient-learner、8 step × 2反復、約9分 / 反復)でIssue 4件、
  seed付きMonkey(15 step、15秒)で1件。トリアージは1件70〜100秒・$0.7〜1.0、すべて再現して`ready-for-agent`。
  issue-agentは6件すべてレビュー1ラウンドで統合、1件4〜7分・$1.1〜2.4(実装opus、レビューfable)。モデルの割り当てはMonkey = opus、トリアージ・レビュー = fable、実装 = opus(Fableは判断が要る役に絞る)。再検証は全件通過。
  発見から統合までの合計は$16、人手ゼロ。直した内容: 回答ボタンの連打(#1)、前へ戻っての再記帳(#2)、reload後の達成復元(#3)、
  前へ戻ったときのstep後退(#4)、用語集の重複(#5)、tweakの達成表示(#6)。
- 運用で分かったこと: (1) `claude -p`は未信頼ワークスペース扱いで`settings.json`のallowが効かないので`--allowedTools`を明示する。
  (2)人が同時に編集していることがあるので、本体の汚れは統合で触るファイルと重なるときだけ止める。(3)再検証はmainをビルドし直してから回す。
  (4)開発サーバーの初回コンパイルでツアーの表示が数秒遅れるので、Monkeyはチュートリアル単元で長めに待つ。

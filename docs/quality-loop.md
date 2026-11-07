# 品質改善ループ(Monkey テスト → Issue → 修正 → 再検証)の設計案

TaxForge(`~/Projects/taxforge`)で運用している「人格型 Monkey テスト」と「Issue 駆動の無人修正ループ」を調査し、
AccountingAcademy に移植した。§1〜§3 は調査の記録、§4 以降が設計、§8 が実装したものと使い方。

## 0. 結論

| 観点 | 判断 |
| --- | --- |
| 再利用 | TaxForge の 4 本のシェル(`monkey-loop` / `issue-agent` / `issue-loop` / `claude-usage-limit`)と、プロンプト 6 本・スキーマ 4 本は **ほぼそのまま移植できる**。LLM スタブ・LangGraph・認証まわりの前提は本プロジェクトに無く、むしろ構成が軽くなる |
| 構成 | 探索(Monkey)→ 起票 → **自動トリアージ(新設)** → 修正(worktree で実装、別モデルがレビュー、関門はスクリプト)→ 統合 → **再検証(新設)** の 5 段を、ローカルから手動起動するシェルで回す。GitHub Actions は使わない(ADR 0005) |
| 人手 | 残すのは 3 点だけ。(1) 夜間ループの起動と翌朝のログ確認、(2) `ready-for-human` / `agent:needs-human` が付いた Issue の判断、(3) UI デザインやコンテンツ方針に関わる修正の採否 |
| 本プロジェクト固有 | 不具合の半分は「コンテンツ」(解説・採点・誤解判定)に出ると見込む。Monkey に **コンテンツ監査の人格** を置き、オラクルに **貸借一致・採点の整合** を入れる。E2E が 24 秒で回るので、修正の関門に E2E を毎回含められる(TaxForge では重くて外していた) |
| 費用の目安 | TaxForge 実績: 修正 1 件 $1.5〜18(中央値 $4 前後)、5〜35 分。Monkey 1 セッション(20 step)約 40 分。サブスクリプション認証なら利用上限の枠に吸収される |

## 1. TaxForge の仕組み(調査結果)

### 1.1 構成要素

| 要素 | 場所 | 役割 |
| --- | --- | --- |
| 設計書 | `docs/design/monkey-e2e.md`(§9 が運用設計)、`docs/design/issue-agent.md` | 調査と設計判断の記録 |
| Monkey スキル | `.claude/skills/monkey-test/SKILL.md` + `personas/*.md`(12 人格) | Claude Code が Playwright MCP でテスター人格として操作する手順。前提確認、状態判定表、異常判定表、禁止事項、人格ごとの「癖」(重み付き操作候補 10 個) |
| 無人ループ | `scripts/monkey-loop.sh`(約 110 行) | 終了時刻まで人格をランダムに選んで `claude -p` を反復。stop ファイル、3 連続失敗で停止、利用上限はリセットまで待機 |
| 環境起動 | `scripts/monkey-services.sh` | Supabase / スタブ / LangGraph / Next をまとめて up / down / status |
| 利用上限 | `scripts/claude-usage-limit.sh` | ログの文言で上限を検知し、10 分ごとに haiku へ疎通して解除を待つ |
| Issue 修正 | `scripts/issue-agent.sh`(約 330 行)+ `scripts/issue-agent/*.md`(work / gate / review / recheck / fix / plan)+ `*.schema.json` | 1 Issue を worktree で Opus が調査・計画・実装 → スクリプトの関門(未コミット無し・差分あり・保護パス・`make check`)→ Fable が読み取り専用でレビュー(`must` があれば差し戻し、最大 2 ラウンド)→ `feature` へ `--no-ff` マージ → push。ラベル `agent:in-progress` / `agent:done` / `agent:needs-human` で状態を持つ |
| Issue ループ | `scripts/issue-loop.sh` | `ready-for-agent` の Issue を古い順に `issue-agent.sh` へ渡す。終了コードで継続可否を決める(環境の問題だけ停止) |
| トリアージ | `.claude/skills/triage/`(人が `/triage` で起動) | `needs-triage` → `ready-for-agent` へ。Agent Brief を書く。**ここは人手** |
| ラベル語彙 | `docs/agents/triage-labels.md`、`make issue-labels` | needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix + `agent:*` |

### 1.2 実績

- Monkey: セッション 141 回(2026-09-08〜09-16)。起票は Issue #41〜#187 のうち大半。1 セッションあたり新規 0〜2 件、既存 Issue へのコメント 0〜1 件。「未再現」は履歴に残すだけという運用が機能している(誤検知で Issue が汚れていない)。
- issue-agent: 40 件処理、37 件統合、3 件は `needs_human`(再現しない・マイグレーション要)。レビューは 1 ラウンドで承認が 7 割。
- 見つかった不具合の型は「タイミング × 状態遷移」(二重送信、reload 復元、タブ間伝播、権限変更の反映)と「境界値」(0 バイト、20 MiB、2 万文字、日本語キー)が多い。

### 1.3 TaxForge で観察できた課題(移植時に直す)

| 課題 | 対応 |
| --- | --- |
| Playwright MCP は 1 ツール呼び出しが数秒で、1 step 約 2 分。20 step で 40 分 | 操作は **Claude が Playwright スクリプト(Node)を書いて Bash で実行** する方式を主にし、MCP は観察・試行用に併用する。再現スクリプトが成果物として残り、そのまま回帰テストの種になる |
| MCP はスクリーンショットをローカルに残さない | スクリプト方式なら `page.screenshot()` と trace が残る |
| 反復の残り時間が 6 分しか無く、環境確認もせず空振りした回がある | ループ側で「残りが 1 反復の見込み所要時間未満なら始めない」を必須にする(issue-loop には既にある) |
| トリアージが人手 | 読み取り専用の `triage-agent`(§4.3)を新設し、再現できたものだけ `ready-for-agent` にする |
| `Bash(git push:*)` の前方一致は `cd x && git push` を素通りする | 最初から PreToolUse フックで Bash の文字列を検査する(`--settings` で無人セッションだけに適用) |
| `feature` と `main` の 2 本運用が前提 | 本プロジェクトは `main` 一本。統合先を `main` にし、push の `Closes #n` で Issue が閉じる |

## 2. 再利用できる部分

| 区分 | 対象 | 扱い |
| --- | --- | --- |
| そのまま | `claude-usage-limit.sh`、`issue-loop.sh`(変数名のみ)、`issue-agent/*.schema.json`、`fix.md`、`gate.md`、`recheck.md` | コピー |
| 書き換え | `issue-agent.sh`(`feature`→`main`、`make check`→`pnpm` のチェック群、`uv sync` 削除、保護パス、禁止ツール)、`work.md` / `review.md`(読むべき docs、回帰テストの必須化)、`monkey-loop.sh`(環境起動、人格一覧、残り時間の下限)、`monkey-services.sh`(Supabase と Next だけ) | 移植 |
| 新規 | `monkey-test` スキル本体と人格(本プロジェクトの画面と学習者に合わせる)、オラクル、`triage-agent.sh`、`issue-verify.sh`、Issue 本文のテンプレート、既知の挙動リスト | 書く |
| 不要 | OpenAI スタブ、`langgraph.e2e.json`、偽 R2、検証ユーザー表、レート制限の禁止事項、`ollama` 切替 | 持ち込まない |

## 3. 本プロジェクトとの前提の違い

| 項目 | TaxForge | AccountingAcademy | 影響 |
| --- | --- | --- | --- |
| 外部 LLM | 製品が OpenAI を呼ぶ(スタブ必須) | 無し | 環境は Supabase ローカル + `pnpm dev` だけ |
| 認証 | メール + パスワード、組織、ロール | 匿名サインイン(最初の回答時) | 検証ユーザー不要。セッションごとに新しいブラウザコンテキストで「新規ゲスト」になる。レート制限の心配が無い |
| ブランチ | `feature` → `main` | `main` 一本 | worktree は `main` 起点、統合先も `main` |
| チェック | `make check`(lint / type / pytest / Vitest) | `pnpm lint` / `typecheck` / `test` / `build` / `playwright test`(計 2 分弱) | 関門に E2E を毎回含める |
| 不具合の所在 | UI の状態遷移、権限 | UI に加えて **コンテンツ**(解説、採点、誤解判定、用語参照、図) | コンテンツ監査の人格とオラクルを足す |
| 既存の E2E | 無し(Storybook のみ) | `e2e/learning-loop.spec.ts` が全単元を正解で通す | 「正解を入れたのに不正解」のオラクルにそのまま使える。`fillEntry` 等のヘルパーをスクリプト型 Monkey で共用 |
| ビルド | Make | pnpm scripts | `scripts/*.sh` を直接呼ぶ(Makefile は足さない) |

## 4. 提案する構成

```
scripts/services.sh up|status|down        Supabase ローカル + pnpm dev
scripts/monkey-loop.sh  (MONKEY_UNTIL)    ① 探索: 人格を選んで claude -p → 再現 → 起票(needs-triage)
scripts/triage-agent.sh <n> / triage-loop ② 自動トリアージ: 再現スクリプトを main で実行 → ready-for-agent / needs-info / ready-for-human
scripts/issue-agent.sh  <n> / issue-loop  ③ 修正: worktree で実装 → 関門 → レビュー → main へ --no-ff マージ → push(Closes #n で閉じる)
scripts/issue-verify.sh <n>               ④ 再検証: 閉じた Issue の再現スクリプトを main で再実行 → 検証済みコメント or reopen
                                          ⑤ 継続: 翌晩の ① が自然に回帰を拾う
```

### 4.1 ① 探索(Monkey)

2 系統を持つ。先に A を作り、A で「効く壊し方」が分かってから B に移す(TaxForge と同じ順)。

**A. 人格型(Claude Code が操作)**: UX の問題(分かりにくい、迷う、誤解を招く文言)はこれでしか見つからない。

- 起動: `claude -p` で `monkey-test` スキルを 1 人格ぶん。`--allowedTools "Bash,Read,Write,Edit,Skill,mcp__playwright"`、`--permission-mode acceptEdits`。
- 操作: 原則 **Playwright スクリプトを書いて実行**(`node scripts/monkey/run.mjs` のような薄いランナーに、人格の判断で書いた操作を渡す)。スクリーンショットと trace を `logs/monkey/<session>/` に残す。MCP の `browser_snapshot` は「いま何が見えているか」を読むために使う。
- 人格(初期 7 本。学習者として自然で、かつ壊し方が異なるもの):

| 人格 | 狙い |
| --- | --- |
| 初めての学習者 | チュートリアルを途中で閉じる・スキップ・やり直す。バナーの出方。「使い方」から再開。何をすればいいか分からず止まる箇所を記録(UX) |
| せっかちな学習者 | 連打、入力途中で記帳、途中で reload・戻る・別単元へ移動、再開時の状態復元 |
| 間違えまくる学習者 | 空欄、0、負数、全角数字、桁区切り、科目名の別名・誤字・前方一致、貸借逆、行の追加と削除の繰り返し、誤解フィードバックが出るか・文言が適切か |
| スマホで学ぶ学習者 | 390×844。3 ペインの折りたたみ、横はみ出し、ポップオーバーの位置、フライングアニメーションの崩れ、1024px 境界の resize |
| 用語を全部触る学習者 | すべての `[[id]]` ポップオーバー、用語集、ポップオーバー内の用語の連鎖、Esc・外側クリック、キーボードだけで操作 |
| タブとデータをいじる学習者 | 同じ単元を 2 タブ、localStorage・Cookie 削除、匿名ユーザーの切替、進捗の保存と競合、`?tour=1` などの URL 直打ち |
| コンテンツ監査者 | 単元を 1 つ選び、解説の 5 節が揃っているか、数字が本文・図・採点で一致するか、正解を入れて正解になるか、誤答に対する誤解 ID の説明が当たっているか、図の表示崩れ |

- オラクル(これに当たったら記録。文面の一致ではなく不変条件で判定):

| 検知 | 手段 |
| --- | --- |
| 未捕捉例外、`console.error`、hydration エラー | `page.on("pageerror")` / `page.on("console")`(Playwright のキャレット非表示由来の警告は除外) |
| 5xx、`requestfailed`、匿名サインイン後の Supabase 401 / 403 | `page.on("response")` |
| エラー境界、「次へ」が条件を満たしても有効にならない、ツアーが進めない | DOM |
| **貸借不一致の表示**: 結果ペインの合計が記帳済み仕訳の合計と合わない | DOM の数値を `src/lib/ledger.ts` と同じ計算で突合 |
| **採点の整合**: `.velite/units.json` の正解を入れて不正解、または誤答の定義済みパターンに誤解 ID が付かない | E2E ソルバーと同じ経路 |
| reload・再訪で進捗(ステップ、記帳済み仕訳)が戻る、`unit_progress` / `attempts` に行が増えない | ローカル Supabase を `psql` で確認 |
| 390px で横スクロールが出る、フォーカスが消える、ポップオーバーが画面外 | `document.documentElement.scrollWidth`、`document.activeElement` |

- 終了処理: 異常を 1 回再現し、再現したものだけ起票。`gh issue list --state open --label bug` で重複確認。既知の挙動(`.claude/skills/monkey-test/known.md`)は起票しない。

**B. スクリプト型(seed 付き PRNG)**: LLM 費用 0 で夜間に数百 seed。`e2e/monkey.spec.ts` として Playwright test に載せ、`fillEntry` などの既存ヘルパーを共用する。action は 15〜25 個(単元へ移動、ランダムな科目と金額を入れる、記帳、次へ、戻る、reload、時系列スライダー、タブ切替、用語クリック、resize)。失敗時は seed と操作列を出力し、同じ seed で再現できる。オラクルは A と共通のモジュールにする。

### 4.2 起票(Issue)

Monkey が `gh issue create` で作る。本文のテンプレート(TaxForge の #187 の形を踏襲し、再現スクリプトを足す):

```
## 現象
## 再現手順(番号付き。URL、入力値、操作)
## 期待 / 実際
## 実測(日時、回数 x/y、console・network の抜粋、DB の行)
## 影響と優先度(p1: 学習が進められない / p2: 誤った理解を招く・保存されない / p3: 見た目・文言)
## 証拠(スクリーンショットと trace のパス。logs/monkey/<session>/)
## 再現スクリプト(e2e/repro/issue-<n>.spec.ts に置ける Playwright の test 1 本)
---
Monkey テスト(人格: …)で検出。操作履歴: logs/monkey/<session>/history.md
```

ラベル: `bug` + `needs-triage` + `p1`〜`p3` + 領域(`area:ide` / `area:content` / `area:progress` / `area:ui`)。
スクリーンショットは `gh` では Issue に添付できないので、初期はローカルパスの参照に留める。必要になったら
orphan ブランチ `evidence` に push して `blob/evidence/...?raw=true` でリンクする(private repo なのでログイン中の本人だけ見える)。

### 4.3 ② 自動トリアージ(新設。TaxForge では人手)

`scripts/triage-agent.sh <n>`: 読み取り専用の `claude -p --model fable --tools "Read,Grep,Glob,Bash"` が、

1. Issue を読み、再現スクリプトを `main` の最新で実行する(スクリプトが無ければ手順から書く)。
2. 再現した → 原因の当たりと触るファイルを「Agent Brief」コメントに書き、`ready-for-agent` を付ける。
3. 再現しない → `needs-info` を付け、試した条件をコメントする(次の Monkey が同じ現象を見たら追記する)。
4. 設計判断・UI デザイン・コンテンツの方針(例: 誤解の説明文の方針、図の意味)が要る → `ready-for-human`。
5. 既存 Issue と同じ → `duplicate` を付けて閉じ、元の Issue にコメント。

`triage-loop.sh` が `needs-triage` を古い順に処理する。これにより、人が見るのは `ready-for-human` だけになる。

### 4.4 ③ 修正(issue-agent の移植)

TaxForge の流れをそのまま使い、次の点を変える。

| 項目 | TaxForge | 本プロジェクト |
| --- | --- | --- |
| 起点・統合先 | `feature` | `main`(push で `Closes #n` が効き、Issue は自動で閉じる) |
| 依存の導入 | `uv sync` + `pnpm install` | `pnpm install --frozen-lockfile` と `.env.local` のコピーのみ |
| 関門 | `make check` | `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm exec playwright test`(約 2 分。E2E は `pnpm dev` を再利用せず worktree 内で `pnpm start` を 3001 などで起こす) |
| 回帰テストの必須化 | 推奨 | **必須**。Issue の再現スクリプトを `e2e/repro/issue-<n>.spec.ts` か Vitest に昇格させ、修正前に失敗・修正後に成功することを `work.md` で求める。レビューは「振る舞いを変えたのにテストが無い」を `must` にする(既存と同じ) |
| 保護パス | migrations、`.github`、`Makefile`、`scripts/issue-*`、`.env` | `supabase/migrations/`、`.github/`、`.githooks/`、`scripts/`、`.claude/`、`velite.config.ts` のスキーマ変更、`.env*`。`content/` は **許可**(コンテンツの不具合が主戦場) |
| 禁止ツール | TaxForge の MCP 群 | `mcp__next-devtools` 以外の MCP、`Bash(supabase:*)`、`Bash(gh issue edit|close:*)`、git の push / merge / checkout / worktree。加えて PreToolUse フックで `git push` を含む Bash 文字列を拒否 |
| モデル | 実装 opus / レビュー fable | 同じ(実績あり) |
| 統合モード | 直統合 | `ISSUE_MODE=merge`(既定)と `ISSUE_MODE=pr`(`gh pr create` で止める)。**導入初期は `pr` で 5 件ほど人が見てから `merge` に切り替える**(TaxForge §8 と同じ段階導入) |

コンテンツの修正で注意する境界(CLAUDE.md): 誤解 ID を省略しない、試験固有の情報を単元に書かない、5 節テンプレートを省略しない。`review.md` の Standards にこの 3 点を明記する。

### 4.5 ④ 再検証(新設)

`scripts/issue-verify.sh <n>`: 統合後に `main` で Issue の再現スクリプト(= 昇格した回帰テスト)を単体で実行する。
通れば「検証済み: <コミット>」とコメントし閉じたまま、落ちれば reopen して `agent:needs-human`。
issue-agent の後片付けから呼ぶので、人は何もしない。回帰テストが関門にも入っているため二重だが、
「関門は worktree、再検証は統合後の `main`」という違いがあり、マージ順序由来の回帰を拾える。

### 4.6 ⑤ 継続

夜間に 1 本のシェル(`scripts/quality-night.sh UNTIL=06:00`)で ① → ② → ③ を順に走らせる。
①の時間配分は `MONKEY_UNTIL`、残りを ②③ に回す。朝は `scripts/issue-agent.sh status` と `logs/` を見る。
Monkey の人格は「前回起票した領域を避ける」ような賢さは持たせず、ランダムで足りる(TaxForge で十分だった)。

## 5. 安全策

| 対象 | 手段 |
| --- | --- |
| `main` の誤変更 | worktree 内で作業し、`main` は本体がチェックアウト済み(git が切り替えを拒否する)。統合はスクリプトだけ |
| 本番環境 | 本番 Supabase は未作成。作った後も `.env.local` はローカルのキーしか持たせず、`supabase link` をしない |
| 暴走 | `timeout`、`--max-turns`、`--max-budget-usd`、ラウンド上限 2、ループは終了時刻と 3 連続失敗で停止 |
| レビュアーの改変 | 編集ツール無し + 前後の HEAD と作業ツリーの比較 |
| Monkey の DB 汚染 | ローカル Supabase だけ。匿名ユーザーは 90 日で消えるが、夜間に数百人増えるので `pnpm db:reset` を週 1 で回す |
| 記録 | 判定材料(計画・指摘・関門の出力・再現スクリプト)を `logs/`(gitignore)と Issue コメントに残す |

## 6. 導入の順番(各段階で 1 回動かしてから次へ)

1. **土台(半日)**: ラベル作成スクリプト、Issue 本文テンプレート、`scripts/services.sh`、`claude-usage-limit.sh` のコピー、`docs/` と CLAUDE.md の追記。
2. **人格型 Monkey(1 日)**: スキル本体、オラクルの Playwright モジュール(`scripts/monkey/oracle.mjs`)、人格 7 本、`known.md`、`monkey-loop.sh`。対話で 2 人格を回して Issue の質を見る。
3. **issue-agent(1 日)**: 移植と関門の書き換え、PreToolUse フック、`ISSUE_MODE=pr` で 5 件。レビューの JSON を読んで `must` の閾値を確認し、`merge` に切り替える。
4. **triage-agent と issue-verify(半日)**: 再現スクリプトの実行とラベル付け。
5. **スクリプト型 Monkey(1 日)**: `e2e/monkey.spec.ts`。action は段階 2 で効いた操作から選ぶ。
6. **夜間運用**: `quality-night.sh`。1 週間回して、起票の精度(再現率、重複率、`needs-human` 率)と費用を計測し、人格とオラクルを調整する。

## 7. 未確認事項

- `--max-budget-usd` がサブスクリプション認証で効くか(TaxForge でも未確認)。
- worktree 内で E2E を回すときのポート(3000 は `pnpm dev` が使う)。`playwright.config.ts` の `baseURL` とポートを環境変数化する必要がある。
- `claude -p` から Playwright スクリプトを実行する方式で、1 step あたりの所要時間がどれだけ縮むか(MCP の 2 分 / step との比較)。
- 匿名ユーザーが夜間に増えたときの `pg_cron` の削除負荷(90 日後に一括で来る)。

## 8. 実装と使い方(2026-11-07)

| 段 | 実装 | 起動 |
| --- | --- | --- |
| 環境 | `scripts/services.sh`(Supabase + `pnpm dev`)、`scripts/labels.sh`(ラベル作成、初回のみ) | `scripts/services.sh up` |
| ① 探索 A(人格型) | `.claude/skills/monkey-test/`(SKILL、人格 7 本、`issue-template.md`、`known.md`)、`scripts/monkey/session.mjs`(オラクル・スクリーンショット・DB 参照・仕訳入力)、`scripts/monkey-loop.sh` | `MONKEY_UNTIL=23:00 scripts/monkey-loop.sh`。対話なら `/monkey-test <人格> [step]` |
| ① 探索 B(seed 付き) | `e2e/monkey.spec.ts`(状態に応じた 22 action、seed で再現)、`scripts/monkey-scripted.sh`(複数 seed → 所見があれば Claude が `/monkey-test scripted <seed>` で再現・起票) | `scripts/monkey-scripted.sh` / `MONKEY=1 MONKEY_SEED=7 pnpm exec playwright test e2e/monkey.spec.ts` |
| ② トリアージ | `scripts/triage-agent.sh` + `scripts/issue-agent/triage.md`(読み取り専用。`main` で再現 → Agent Brief → `ready-for-agent` / `ready-for-human` / `needs-info` / `duplicate` / `wontfix`) | `scripts/triage-agent.sh <n>` / `loop` |
| ③ 修正 | `scripts/issue-agent.sh`、`scripts/issue-loop.sh`、`scripts/issue-agent/{work,gate,review,recheck,fix}.md` + スキーマ、`scripts/issue-agent/guard.sh`(PreToolUse で Bash の文字列を検査)、`scripts/check.sh`(関門。E2E は 3100 番で本番ビルド) | `scripts/issue-agent.sh <n>` / `ISSUE_UNTIL=06:00 scripts/issue-loop.sh` |
| ④ 再検証 | `scripts/issue-verify.sh`(統合後の `main` で `issue-<n>` を名前に含むテストを実行 → `agent:verified` か reopen) | issue-agent の最後に自動。手でも可 |
| ⑤ 継続 | `scripts/quality-night.sh`(seed 付き Monkey → 人格型 Monkey → トリアージ → 修正) | `QUALITY_UNTIL=06:00 scripts/quality-night.sh` |

- ログは `logs/`(gitignore): `logs/monkey/<日時>-<人格>/`(history.md、step-NN.mjs、shots/、oracle.jsonl、trace)、`logs/monkey-scripted/<seed>.log`、`logs/triage/<n>/`、`logs/issue-agent/<n>/`。
- 人格型 Monkey は `MONKEY_PARALLEL=3` で 3 人格まで同時に走らせられる(人格ごとに別ブラウザ。同じ人格は同時に走らない。起票直前の重複確認を人格側にも求めている)。
- 状況の確認は `scripts/issue-agent.sh status`。止めるのは `scripts/monkey-loop.sh stop` / `scripts/issue-loop.sh stop`。
- 人が見るもの: `ready-for-human` と `agent:needs-human` の Issue(`gh issue list --label ready-for-human,agent:needs-human`)、
  統合後の Issue コメント(残った should / nit)、週 1 回の `pnpm db:reset`(夜間に匿名ユーザーが増えるため)。
- 初回の実測(2026-11-07、1 サイクル): 人格型 Monkey(impatient-learner、8 step × 2 反復、約 9 分 / 反復)で Issue 4 件、
  seed 付き Monkey(15 step、15 秒)で 1 件。トリアージは 1 件 70〜100 秒・$0.7〜1.0、すべて再現して `ready-for-agent`。
  issue-agent は 6 件すべてレビュー 1 ラウンドで統合、1 件 4〜7 分・$1.1〜2.4(実装 opus、レビュー fable)。モデルの割り当ては Monkey = opus、トリアージ・レビュー = fable、実装 = opus(Fable は判断が要る役に絞る)。再検証は全件通過。
  発見から統合までの合計は $16、人手ゼロ。直した内容: 回答ボタンの連打(#1)、前へ戻っての再記帳(#2)、reload 後の達成復元(#3)、
  前へ戻ったときの step 後退(#4)、用語集の重複(#5)、tweak の達成表示(#6)。
- 運用で分かったこと: (1) `claude -p` は未信頼ワークスペース扱いで `settings.json` の allow が効かないので `--allowedTools` を明示する。
  (2) 人が同時に編集していることがあるので、本体の汚れは統合で触るファイルと重なるときだけ止める。(3) 再検証は main をビルドし直してから回す。
  (4) 開発サーバーの初回コンパイルでツアーの表示が数秒遅れるので、Monkey はチュートリアル単元で長めに待つ。

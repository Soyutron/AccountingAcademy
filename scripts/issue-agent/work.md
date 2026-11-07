あなたは GitHub Issue #$ISSUE を担当する実装者です。調査 → 計画 → 実装を続けて行ってください。
ユーザーへの質問はできないので、判断は自分で行ってください。
このフェーズは $CUTOFF に強制終了されます。`date` で時刻を確認し、残り 15 分を切ったら新しい作業を始めず、
通っているところまでをコミットして `status` を `blocked` で終えてください。

作業場所は worktree `$WT`(ブランチ `$BRANCH`、`main` 起点)です。前回の試行のコミットが既に載っていることがあるので、
`git log main..HEAD --oneline` で確かめてください。

## 調査と計画

1. `gh issue view $ISSUE --json title,body,labels,comments` で Issue 本文と議論を読む。「Agent Brief」のコメントがあればそれを仕様の正とする。
   本文の「再現スクリプト」と「再現手順」が出発点。
2. `CLAUDE.md`、関連する `docs/*.md`(IDE の挙動なら `docs/ide-design.md`、コンテンツなら `docs/content-model.md`、保存なら `docs/architecture.md`)を読む。調査は実装に必要な範囲にとどめる。
3. 原因を特定し、変更方針を固めてから実装に移る。`plan` に変更方針・触るファイル・テスト・スコープ外を簡潔に書く(レビュアーが読む。長文にしない)。

次のいずれかに当たるなら **実装せず** `status` を `needs_human` にし、`summary` に理由を書いて終える:

- 仕様が曖昧で、決めないと実装できない(UI デザインの判断、解説の方針、図の意味の変更)
- DB マイグレーション、`velite.config.ts` のスキーマ変更、外部サービスの設定が必要
- Issue の内容が既に解決済み、または再現しない(再現スクリプトを実行して確かめる)

## 実装のルール

- 作業ブランチは現在チェックアウトされている `$BRANCH` です。ブランチを切り替えない、push しない。
- `CLAUDE.md` の実装方針と境界に従う。特に: 誤解 ID を省略した演習を増やさない、試験固有の情報を単元や概念に書かない、
  解説の 5 節テンプレートを省略しない、用語は `[[id]]` で参照する、採点は純粋関数のまま。
- **回帰テストを必ず追加する。** Issue の再現スクリプトを `e2e/repro/issue-$ISSUE.spec.ts` に置く(UI の不具合)か、
  採点・会計計算・コンテンツなら `src/lib/*.issue-$ISSUE.test.ts` に Vitest で書く。修正前に失敗し、修正後に通ることを確かめる。
  ファイル名に `issue-$ISSUE` を含めること(統合後の再検証がこの名前で探す)。
- 完了前に `scripts/check.sh`(lint / typecheck / test / build / E2E。E2E は 3100 番で本番ビルドを起動する)を通す。
  スクリプトが同じ `scripts/check.sh` を独立に再実行するので、通っていない状態で `done` と申告しても差し戻される。
- すべての変更をコミットする(未コミットの変更を残さない)。コミットメッセージは既存の履歴に倣い、
  1 行目に変更の要約、本文に「なぜその実装なのか」と `Closes #$ISSUE` を書く。
  末尾に `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` を付ける。
- `.env*`、`supabase/migrations/`、`.github/`、`.githooks/`、`scripts/`、`.claude/`、`velite.config.ts` は変更しない
  (変更が必要ならスクリプトが人手に回す。その旨を `summary` に書いて `blocked` で終える)。
- 一時ファイルが要るなら scratchpad か `logs/` に置く。

## 出力

- `status`: 完了なら `done`。人手が要るなら `needs_human`、実装できない事情があれば `blocked`(いずれも `summary` に理由)。
- `plan`: 実装前に固めた計画(`needs_human` / `blocked` なら空文字でよい)。
- `summary`: 何をどう変えたか、判断に迷った点、レビュアーに見てほしい点。
- `verified`: 実際に実行して通ったチェックやテストのコマンド。

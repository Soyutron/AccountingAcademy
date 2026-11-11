あなたはトリアージ担当です。GitHub Issue #$ISSUEを読み、再現を確かめて振り分けてください。
ユーザーへの質問はできないので、判断は自分で行ってください。
このフェーズは$CUTOFFに強制終了されます。`date`で時刻を確認し、残り10分を切ったら判定をまとめてください。

**ファイルを変更してはいけません。gitの状態を変えてはいけません。Issueのラベルとコメントはスクリプトが書きます。**
一時ファイル(再現スクリプトなど)は`$TRIAGE_DIR/`に置いてください。

## 手順

1. `gh issue view $ISSUE --json title,body,labels,comments`で本文とコメントを読む。
2. 重複確認: `gh issue list --state all --label bug --limit 100 --json number,title,state`で同じ現象のIssueが無いか見る
   (open / closedとも。closedで`agent:verified`なら直っているはずなので、再発として扱う)。
3. 再現: 本文の「再現スクリプト」があれば`$TRIAGE_DIR/repro.mjs`か`.spec.ts`として書き出し、`main`の最新(このチェックアウト)で実行する。
   無ければ「再現手順」からPlaywrightスクリプトを書く。雛形は`scripts/monkey/session.mjs`(`MONKEY_SESSION_DIR=$TRIAGE_DIR`)。
   開発サーバーはhttp://localhost:3000(`scripts/services.sh status`で確認。downならupする)。
   2回実行して再現率を見る。
4. 再現したら、原因の当たりをつける(どのファイルのどの処理か。深追いはしない)。
5. 判定:
   - `ready_for_agent`: 再現し、修正の方針が実装者に任せられる(仕様が明確、設計判断が不要)。
   - `ready_for_human`: 再現したが、UIデザイン・解説の方針・図の意味・コンテンツの教育方針・DBスキーマの判断が要る。
   - `needs_info`: 再現しない。試した条件を書く。
   - `duplicate`: 既存のopenなIssueと同じ。`duplicate_of`に番号。
   - `wontfix`: `known.md`(`.claude/skills/monkey-test/known.md`)にある既知の挙動、または仕様どおり。
6. `brief`にAgent Briefを書く(`ready_for_agent` / `ready_for_human`のとき)。見出しは次の4つ:
   **再現**(確認した手順と率、環境)/ **原因の当たり**(ファイルと処理)/ **直し方の方針**(1〜3行。実装者を縛りすぎない)/
   **回帰テスト**(どの経路をどのテストで固定するか。`e2e/repro/issue-$ISSUE.spec.ts`かVitest)。
   `ready_for_human`なら、なぜ人の判断が要るかを最初に書く。

## 出力

- `verdict`: 上の5つのいずれか。
- `priority`: `p1` / `p2` / `p3`(本文のラベルが妥当ならそのまま。変えるなら`reason`に理由)。
- `reason`: 判定の根拠(1〜3行)。
- `brief`: Agent Brief(Markdown)。該当しなければ空文字。
- `duplicate_of`: 重複先のIssue番号(無ければ0)。

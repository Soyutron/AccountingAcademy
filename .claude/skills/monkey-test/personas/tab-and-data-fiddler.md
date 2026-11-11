# タブとデータをいじる学習者

**画面**: 1280×800。`context.newPage()`で2タブ、`context.clearCookies()`と`localStorage.clear()`を使う。

**性格**: 同じ単元を2つのタブで開く。途中でブラウザのデータを消す。URLを書き換える。別の端末のつもりで新しいゲストになる。

**狙い**: 進捗の保存と競合、匿名ユーザーの扱い、チュートリアル状態(localStorage)と進捗(DB)の食い違い、URL直打ち。

**癖**:

1. 同じ単元を2タブで開き、片方でステップを2つ進め、もう片方でreload。進捗が追いつくか、片方の記帳がもう片方に二重に出ないか。
2. 2タブで同時に「記帳する」。`attempts`と`unit_progress`の行数・stepを確認する。
3. 記帳後に`localStorage.clear()`してreload。チュートリアル状態(pendingに戻る)と進捗(DBに残る)の整合。バナーが再び出るのは仕様かどうかを記録する。
4. 記帳後にCookieを全部消してreload(匿名セッション喪失)。進捗がゲストから見えなくなるのは仕様。保存エラーが出ずに新しいゲストとして続けられるか。
5. 存在しない単元`/units/nope/nope`、`/topics/nope`、`/paths/nope`、`/units/tutorial/first-entry`(隠しテーマ)を直接開く。404か案内か、例外が出ないか。
6. `?tour=1`を通常の単元に付ける。何も起きないか壊れるか。
7. 単元を完了してから`unit_progress`の`step`をSQLで99にして開き直す(`db("update unit_progress set step=99 where unit_id='...'")`)。範囲外の再開で落ちないか。元に戻す。
8. DBの`attempts.answer`を壊れたJSON相当(`'{}'`)にして開き直す(`replayEntries`が落ちないか)。
9. 2タブで片方がチュートリアルを完了、もう片方はpendingのまま単元を開く。バナーの表示。
10. 新しいゲスト(`fresh: true`)で同じ単元を開き、前のゲストの進捗が見えないこと(RLS)を確かめる。

**やらないこと**: `auth.users`の削除、`pnpm db:reset`。SQLで変えた行は終了時に元へ戻す。

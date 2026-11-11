# 0005. 品質確認はローカルで完結させ、GitHub Actionsは最小構成に限定する

日付: 2026-11-07
状態: 採用

## 背景
個人開発のprivateリポジトリで、開発はAIエージェントと対話しながらローカルで進める。E2EをCIで回すとローカルSupabaseの起動と本番ビルドで10分近くかかり、CI環境の遅さで不安定にもなった。
一方、ローカルではlint・型・単体テスト・E2E(13単元)が合計1分以内に通る。

## 決定
- **検査はローカルが正。** `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm exec playwright test`(E2E)をローカルで回す。コンテンツやUIを変えたらE2Eを必ず回す(CLAUDE.md)。
- **push前のフック**でlint・型・単体テストを自動実行する(`.githooks/pre-push`。`git config core.hooksPath .githooks`で有効化。約30秒)。E2Eはフックに入れない(開発サーバーとSupabaseが要るため。エージェントと人が明示的に回す)。
- **GitHub Actionsは1ジョブだけ**(lint・型・単体テスト・ビルド、約45秒)。mainへのpushとpull requestで走る。目的は「別の環境でも依存関係と型が壊れていないこと」の確認で、ローカルの代替ではない。
- E2E・目視確認・性能計測はCIに入れない。

## 検討した代替
- CIを完全にやめる: 運用コストはゼロになるが、`pnpm install --frozen-lockfile`やビルドが別環境で通ることを確かめる手段が無くなる。45秒 × 月数十回なら無料枠(privateは2,000分/月)の数%で、維持する価値がある。
- CIでE2Eを回す: 上記の通り遅く不安定。必要になれば(複数人開発、公開前の回帰確認)手動起動のワークフローとして復活させる。

## 影響
- 新しい開発環境では`git config core.hooksPath .githooks`を1回実行する(README)。
- CIが落ちたら、まずローカルで同じコマンドを実行して再現する。

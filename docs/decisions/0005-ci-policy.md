# 0005. 品質確認はローカルで完結させ、GitHub Actions は最小構成に限定する

日付: 2026-11-07
状態: 採用

## 背景
個人開発の private リポジトリで、開発は AI エージェントと対話しながらローカルで進める。E2E を CI で回すとローカル Supabase の起動と本番ビルドで 10 分近くかかり、CI 環境の遅さで不安定にもなった。
一方、ローカルでは lint・型・単体テスト・E2E(13 単元)が合計 1 分以内に通る。

## 決定
- **検査はローカルが正。** `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm exec playwright test`(E2E)をローカルで回す。コンテンツや UI を変えたら E2E を必ず回す(CLAUDE.md)。
- **push 前のフック**で lint・型・単体テストを自動実行する(`.githooks/pre-push`。`git config core.hooksPath .githooks` で有効化。約 30 秒)。E2E はフックに入れない(開発サーバーと Supabase が要るため。エージェントと人が明示的に回す)。
- **GitHub Actions は 1 ジョブだけ**(lint・型・単体テスト・ビルド、約 45 秒)。main への push と pull request で走る。目的は「別の環境でも依存関係と型が壊れていないこと」の確認で、ローカルの代替ではない。
- E2E・目視確認・性能計測は CI に入れない。

## 検討した代替
- CI を完全にやめる: 運用コストはゼロになるが、`pnpm install --frozen-lockfile` やビルドが別環境で通ることを確かめる手段が無くなる。45 秒 × 月数十回なら無料枠(private は 2,000 分/月)の数 % で、維持する価値がある。
- CI で E2E を回す: 上記の通り遅く不安定。必要になれば(複数人開発、公開前の回帰確認)手動起動のワークフローとして復活させる。

## 影響
- 新しい開発環境では `git config core.hooksPath .githooks` を 1 回実行する(README)。
- CI が落ちたら、まずローカルで同じコマンドを実行して再現する。

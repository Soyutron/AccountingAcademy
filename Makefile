# 開発・ビルド・テスト・起動・品質改善ループの入口。新しいコマンドは原則ここに足す。
# 実体は package.json の scripts と scripts/*.sh。引数は環境変数で渡す(例: make monkey MONKEY_UNTIL=22:00)。
.DEFAULT_GOAL := help
.PHONY: help install hooks setup dev db-start db-stop db-reset services-up services-down services-status \
        content lint typecheck test test-watch e2e check build start \
        monkey monkey-stop monkey-scripted triage issue issue-loop issue-stop issue-status issue-verify quality-night labels

##@ セットアップ

install: ## 依存をインストールする(lockfile 固定)
	pnpm install --frozen-lockfile

hooks: ## push 前に lint・型・テストを走らせる git hook を有効にする(ADR 0005)
	git config core.hooksPath .githooks

setup: install hooks ## 初回セットアップ(install + hooks)。Supabase のキーは `make db-start` の出力を .env.local に書く

##@ 開発

dev: ## Velite の監視 + Next.js 開発サーバー(http://localhost:3000)
	pnpm dev

db-start: ## Supabase ローカルスタックを起動する(Docker。キーを .env.local に書く)
	pnpm db:start

db-stop: ## Supabase ローカルスタックを停止する
	pnpm db:stop

db-reset: ## Supabase をマイグレーションから作り直す(週 1 を目安。worktree 並走中は 1 セッションだけ)
	pnpm db:reset

services-up: ## Monkey・無人ループ用に Supabase + pnpm dev をバックグラウンドで起動する(ログは logs/services/)
	scripts/services.sh up

services-down: ## services-up で起動した Next を止める(Supabase は残す)
	scripts/services.sh down

services-status: ## Supabase と Next の起動状況を表示する
	scripts/services.sh status

##@ 検査・テスト

content: ## コンテンツ検査(Velite。.velite/ に型付き JSON を出す)
	pnpm content

lint: ## ESLint
	pnpm lint

typecheck: ## 型検査(Velite → tsc)
	pnpm typecheck

test: ## 単体テスト(Vitest)
	pnpm test

test-watch: ## 単体テストを監視モードで回す
	pnpm test:watch

e2e: ## E2E(Playwright。開発サーバーとローカル Supabase を使う。コンテンツを変えたら必ず回す)
	pnpm exec playwright test

check: ## lint / 型 / テスト / ビルド / E2E を一括(push 前・統合前の関門。E2E は 3100 番で本番ビルド。CHECK_E2E=0 で E2E を省く)
	scripts/check.sh

##@ ビルド・起動

build: ## 本番ビルド(Velite → next build。standalone 出力)
	pnpm build

start: ## 本番ビルドを起動する(先に make build)
	pnpm start

##@ 品質改善ループ(docs/quality-loop.md)

monkey: ## 人格型 Monkey を終了時刻まで繰り返す(MONKEY_UNTIL=22:00 必須。MONKEY_PARALLEL=3 で同時 3 人格)
	scripts/monkey-loop.sh

monkey-stop: ## 人格型 Monkey を止める(いまの反復が終わってから)
	scripts/monkey-loop.sh stop

monkey-scripted: ## seed 付き Monkey を複数 seed で回し、所見があれば Claude が再現・起票する(MONKEY_SEEDS / MONKEY_SEED)
	scripts/monkey-scripted.sh

triage: ## needs-triage の Issue を再現して振り分ける(ISSUE=<n> で 1 件、省略時は全件)
	scripts/triage-agent.sh $(or $(ISSUE),loop)

issue: ## Issue を 1 件 worktree で実装 → レビュー → main へ統合する(ISSUE=<n> 必須)
	scripts/issue-agent.sh $(ISSUE)

issue-loop: ## ready-for-agent の Issue を終了時刻まで順に処理する(ISSUE_UNTIL=06:00 必須)
	scripts/issue-loop.sh

issue-stop: ## issue-loop を止める(いまの Issue が終わってから)
	scripts/issue-loop.sh stop

issue-status: ## 処理中の Issue と残っている worktree を表示する
	scripts/issue-agent.sh status

issue-verify: ## 統合後の main で Issue の回帰テストを単体実行する(ISSUE=<n> 必須)
	scripts/issue-verify.sh $(ISSUE)

quality-night: ## 夜間ループ: seed 付き Monkey → 人格型 Monkey → トリアージ → 修正(QUALITY_UNTIL=06:00 必須)
	scripts/quality-night.sh

labels: ## 品質改善ループが使う GitHub ラベルを作る(初回のみ。要 gh)
	scripts/labels.sh

##@ その他

help: ## コマンド一覧を表示する
	@awk 'BEGIN {FS = ":.*## "} \
		/^##@ / {printf "\n\033[1m%s\033[0m\n", substr($$0, 5)} \
		/^[a-zA-Z0-9_-]+:.*## / {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo

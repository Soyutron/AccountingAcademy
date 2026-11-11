# 開発・ビルド・テスト・起動・品質改善ループの入口。新しいコマンドは原則ここに足す。
# 実体はpackage.jsonのscriptsとscripts/*.sh。引数は環境変数で渡す(例: make monkey MONKEY_UNTIL=22:00)。
.DEFAULT_GOAL := help
.PHONY: help install hooks setup dev db-start db-stop db-reset services-up services-down services-status \
        content lint typecheck test test-watch e2e check build start \
        monkey monkey-stop monkey-scripted triage issue issue-loop issue-stop issue-status issue-verify quality-night labels

##@ セットアップ

install: ## 依存をインストールする(lockfile固定)
	pnpm install --frozen-lockfile

hooks: ## push前にlint・型・テストを走らせるgit hookを有効にする(ADR 0005)
	git config core.hooksPath .githooks

setup: install hooks ## 初回セットアップ(install + hooks)。Supabaseのキーは`make db-start`の出力を .env.localに書く

##@ 開発

dev: ## Veliteの監視 + Next.js開発サーバー(http://localhost:3000)
	pnpm dev

db-start: ## Supabaseローカルスタックを起動する(Docker。キーを .env.localに書く)
	pnpm db:start

db-stop: ## Supabaseローカルスタックを停止する
	pnpm db:stop

db-reset: ## Supabaseをマイグレーションから作り直す(週1を目安。worktree並走中は1セッションだけ)
	pnpm db:reset

services-up: ## Monkey・無人ループ用にSupabase + pnpm devをバックグラウンドで起動する(ログはlogs/services/)
	scripts/services.sh up

services-down: ## services-upで起動したNextを止める(Supabaseは残す)
	scripts/services.sh down

services-status: ## SupabaseとNextの起動状況を表示する
	scripts/services.sh status

##@ 検査・テスト

content: ## コンテンツ検査(Velite。.velite/ に型付きJSONを出す)
	pnpm content

lint: ## ESLint
	pnpm lint

typecheck: ## 型検査(Velite → tsc)
	pnpm typecheck

test: ## 単体テスト(Vitest)
	pnpm test

test-watch: ## 単体テストを監視モードで回す
	pnpm test:watch

e2e: ## E2E(Playwright。開発サーバーとローカルSupabaseを使う。コンテンツを変えたら必ず回す)
	pnpm exec playwright test

check: ## lint / 型 / テスト / ビルド / E2Eを一括(push前・統合前の関門。E2Eは3100番で本番ビルド。CHECK_E2E=0でE2Eを省く)
	scripts/check.sh

##@ ビルド・起動

build: ## 本番ビルド(Velite → next build。standalone出力)
	pnpm build

start: ## 本番ビルドを起動する(先にmake build)
	pnpm start

##@ 品質改善ループ(docs/quality-loop.md)

monkey: ## 人格型Monkeyを終了時刻まで繰り返す(MONKEY_UNTIL=22:00必須。MONKEY_PARALLEL=3で同時3人格)
	scripts/monkey-loop.sh

monkey-stop: ## 人格型Monkeyを止める(いまの反復が終わってから)
	scripts/monkey-loop.sh stop

monkey-scripted: ## seed付きMonkeyを複数seedで回し、所見があればClaudeが再現・起票する(MONKEY_SEEDS / MONKEY_SEED)
	scripts/monkey-scripted.sh

triage: ## needs-triageのIssueを再現して振り分ける(ISSUE=<n> で1件、省略時は全件)
	scripts/triage-agent.sh $(or $(ISSUE),loop)

issue: ## Issueを1件worktreeで実装 → レビュー → mainへ統合する(ISSUE=<n> 必須)
	scripts/issue-agent.sh $(ISSUE)

issue-loop: ## ready-for-agentのIssueを終了時刻まで処理する(ISSUE_UNTIL=06:00必須。ISSUE_PARALLEL=3で同時3件、統合は1件ずつ)
	scripts/issue-loop.sh

issue-stop: ## issue-loopを止める(いまのIssueが終わってから)
	scripts/issue-loop.sh stop

issue-status: ## 処理中のIssueと残っているworktreeを表示する
	scripts/issue-agent.sh status

issue-verify: ## 統合後のmainでIssueの回帰テストを単体実行する(ISSUE=<n> 必須)
	scripts/issue-verify.sh $(ISSUE)

quality-night: ## 夜間ループ: seed付きMonkey → 人格型Monkey → トリアージ → 修正(QUALITY_UNTIL=06:00必須)
	scripts/quality-night.sh

labels: ## 品質改善ループが使うGitHubラベルを作る(初回のみ。要gh)
	scripts/labels.sh

##@ その他

help: ## コマンド一覧を表示する
	@awk 'BEGIN {FS = ":.*## "} \
		/^##@ / {printf "\n\033[1m%s\033[0m\n", substr($$0, 5)} \
		/^[a-zA-Z0-9_-]+:.*## / {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo

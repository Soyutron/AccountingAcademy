#!/usr/bin/env bash
# seed付きMonkey(e2e/monkey.spec.ts)を複数seedで回し、所見が出たseedごとにClaudeに再現と起票をさせる。
# 設計はdocs/quality-loop.md §4.1 B。LLMを使うのは所見が出たときだけ。
#
#   scripts/monkey-scripted.sh            # 今日のseedをMONKEY_SEEDS本(既定5)
#   MONKEY_SEED=123 scripts/monkey-scripted.sh
#
# 環境変数: MONKEY_SEEDS / MONKEY_SEED / MONKEY_STEPS(specと同じ)、MONKEY_REPORT=0で起票をしない、
#           MONKEY_MODEL(既定opus)/ MONKEY_EFFORT(起票側のclaude -p)
set -u
cd "$(dirname "$0")/.."
ROOT=$PWD
LOG_DIR=logs/monkey-scripted
mkdir -p "$LOG_DIR"
scripts/services.sh up >/dev/null || exit 1
export MONKEY=1 MONKEY_SEEDS="${MONKEY_SEEDS:-5}" MONKEY_STEPS="${MONKEY_STEPS:-40}"
echo "[$(date '+%H:%M:%S')] scripted monkey: seeds=${MONKEY_SEED:-${MONKEY_SEEDS}本} steps=$MONKEY_STEPS"
pnpm exec playwright test e2e/monkey.spec.ts --reporter=line >"$LOG_DIR/run-$(date +%Y%m%d-%H%M%S).log" 2>&1
# 失敗したseedはlogに「## findings」が付いている(今回の実行分だけ見る)
mapfile -t failed < <(grep -l "^## findings" "$LOG_DIR"/*.log 2>/dev/null | xargs -r -n1 basename | sed 's/\.log$//' | grep -E '^[0-9]+$' \
  | while read -r s; do [ "$(find "$LOG_DIR/$s.log" -mmin -30)" ] && echo "$s"; done)
echo "[$(date '+%H:%M:%S')]所見のあるseed: ${failed[*]:-なし}"
[ "${MONKEY_REPORT:-1}" = 1 ] || exit 0
for seed in "${failed[@]}"; do
  session="logs/monkey/$(date +%Y%m%d-%H%M%S)-scripted-$seed"
  mkdir -p "$session"
  cp "$LOG_DIR/$seed.log" "$session/scripted.log"
  echo "[$(date '+%H:%M:%S')] seed ${seed}の所見をClaudeが再現・起票します -> $session/"
  prompt="Skillツールでmonkey-testを引数「scripted $seed」で起動し、その手順どおりに1回だけ実行してください。\
seed付きMonkeyのログは$ROOT/$session/scripted.log、セッションのディレクトリは$ROOT/${session}です。\
ユーザーへの質問はできないので、判断は自分で行ってください。終わったら起票したIssue番号を要約して出力し、終了してください。"
  MONKEY_SESSION_DIR="$ROOT/$session" timeout --foreground -k 30 1800 \
    claude -p "$prompt" --model "${MONKEY_MODEL:-opus}" ${MONKEY_EFFORT:+--effort "$MONKEY_EFFORT"} \
      --permission-mode acceptEdits --allowedTools "Bash,Read,Write,Edit,Skill,Glob,Grep" \
      --disallowedTools "Bash(git push:*)" "Bash(git commit:*)" "Bash(gh issue close:*)" "Bash(gh issue delete:*)" "Bash(gh issue edit:*)" "Bash(pnpm db:reset:*)" "Bash(pnpm db:stop:*)" \
      --strict-mcp-config --mcp-config '{"mcpServers":{}}' >"$session/session.log" 2>&1
  tail -n 5 "$session/session.log"
done

#!/usr/bin/env bash
# Claude Codeの利用上限(5時間枠など)の検知と、リセットされるまでの待機。monkey-loop / issue-loopが使う。
#
#   scripts/claude-usage-limit.sh limited <ログ...>                   # 上限の文言があれば0
#   scripts/claude-usage-limit.sh wait <期限(epoch秒)> [stopファイル]  # 使えるようになるまで待つ
#
# waitはCLAUDE_USAGE_PROBE_INTERVAL秒(既定600)ごとにCLAUDE_USAGE_PROBE_MODELS(空白区切り、既定haiku)へ
# 1ターンの疎通を送り、どのモデルからも上限の文言が消えたら0で返る。
# 期限を過ぎたら1、stopファイルができたら2。リセット時刻の文言は表示用の書式で機械的に読めないため、疎通で確かめる。
set -u
cd "$(dirname "$0")/.."

# CLIが上限として扱う文言のうち、時間で解除されるもの。"rate limit" のような一般語はテスト出力に紛れて誤検知するので入れない。
LIMIT_RE="You've (hit|reached) your|out of (extra )?usage|usage limit reached"

limited() { grep -qiE "$LIMIT_RE" "$@"; }

# 上限はモデルごとに別枠のことがある(Fableだけ尽きる等)ので、ループが使うモデルすべてで確かめる
probe() {
  local m
  : >"$1"
  for m in ${CLAUDE_USAGE_PROBE_MODELS:-haiku}; do
    timeout -k 10 120 claude -p "Reply with exactly: OK" --model "$m" --max-turns 1 --output-format json \
      --tools "" --strict-mcp-config --mcp-config '{"mcpServers":{}}' >>"$1" 2>&1
  done
}

case "${1:-}" in
  limited) shift; limited "$@" ;;
  wait)
    deadline="${2:?期限(epoch秒)を指定してください}"
    stop_file="${3:-}"
    interval="${CLAUDE_USAGE_PROBE_INTERVAL:-600}"
    out=$(mktemp)
    trap 'rm -f "$out"' EXIT
    while :; do
      if [ "$(date +%s)" -ge "$deadline" ]; then echo "期限までに利用上限が解除されませんでした"; exit 1; fi
      if [ -n "$stop_file" ] && [ -e "$stop_file" ]; then echo "待機中にstopファイルを検出しました"; exit 2; fi
      probe "$out"
      if ! limited "$out"; then echo "[$(date '+%H:%M:%S')]利用上限が解除されました"; exit 0; fi
      echo "[$(date '+%H:%M:%S')]利用上限のため待機します(${interval}s後に再確認)"
      sleep "$interval"
    done ;;
  *) echo "使い方: $0 limited <ログ...> | wait <期限(epoch秒)> [stopファイル]" >&2; exit 64 ;;
esac

#!/usr/bin/env bash
# Monkeyテストと無人ループに必要なローカル環境(SupabaseとNext dev)をまとめて起動・停止する。
#
#   scripts/services.sh up | down | status
#
# SupabaseはDockerのローカルスタック(54321)、Nextはpnpm dev(3000)。downはNextだけ止める。
# ログはlogs/services/。
set -u
cd "$(dirname "$0")/.."
LOG_DIR=logs/services
mkdir -p "$LOG_DIR"

port_pid() { ss -ltnp 2>/dev/null | grep ":$1 " | grep -oP 'pid=\K[0-9]+' | head -1; }
supabase_ok() { curl -sf http://127.0.0.1:54321/auth/v1/health >/dev/null; }
# devはコンパイルに失敗してもポートはlistenし続けるので、トップページが返るかで判定する(初回コンパイルは遅い)。
next_ok() { curl -sf --max-time 90 -o /dev/null http://localhost:3000/; }

start_supabase() {
  if supabase_ok; then echo "Supabase : 起動済み(54321)"; return 0; fi
  echo "Supabase : 起動します"
  pnpm db:start >"$LOG_DIR/supabase.log" 2>&1 || { echo "Supabaseを起動できませんでした($LOG_DIR/supabase.log)"; return 1; }
}

start_next() {
  if [ -n "$(port_pid 3000)" ]; then echo "Next     : 起動済み(3000)"; return 0; fi
  [ -f .env.local ] || { echo ".env.localがありません(.env.example参照)"; return 1; }
  echo "Next     : 起動します(pnpm dev、ログ$LOG_DIR/next.log)"
  setsid nohup pnpm dev >"$LOG_DIR/next.log" 2>&1 &
}

wait_ready() {
  local i
  for i in $(seq 1 60); do
    if supabase_ok && next_ok; then return 0; fi
    sleep 2
  done
  echo "起動を確認できませんでした。$LOG_DIR/ のログを見てください"
  return 1
}

# setsidで起こしているのでプロセスグループごと止める(pnpm devは子プロセスがlistenする)。
stop_next() {
  local pid pgid i
  pid=$(port_pid 3000)
  [ -n "$pid" ] || { echo "Next (:3000)は動いていません"; return 0; }
  pgid=$(ps -o pgid= -p "$pid" | tr -d ' ')
  kill -TERM "-$pgid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null
  for i in $(seq 1 20); do
    [ -z "$(port_pid 3000)" ] && { echo "Next (:3000)を停止しました"; return 0; }
    sleep 0.5
  done
  kill -KILL "-$pgid" 2>/dev/null
  echo "Next (:3000)を強制停止しました"
}

case "${1:-}" in
  up) start_supabase || exit 1; start_next || exit 1; wait_ready || exit 1; echo "準備できました: http://localhost:3000" ;;
  down) stop_next; echo "Supabaseは動かしたままです(止めるならpnpm db:stop)" ;;
  status)
    supabase_ok && echo "Supabase : up (54321)" || echo "Supabase : down"
    if next_ok; then echo "Next     : up (3000, pid $(port_pid 3000))"
    elif [ -n "$(port_pid 3000)" ]; then echo "Next     : down (3000はpid $(port_pid 3000)がlistenしていますがページが返りません。$LOG_DIR/next.log)"
    else echo "Next     : down"; fi ;;
  *) echo "使い方: scripts/services.sh up|down|status" >&2; exit 1 ;;
esac

#!/usr/bin/env bash
# 人格型 Monkey テストを終了時刻まで繰り返す。Claude Code の利用上限に達したらリセットまで待って続ける。
# 1 反復 = `claude -p` で monkey-test スキルを 1 人格ぶん実行する。反復ごとにコンテキストは新しくなる。
# 設計は docs/quality-loop.md §4.1。
#
#   MONKEY_UNTIL=22:00 scripts/monkey-loop.sh   # 開始
#   scripts/monkey-loop.sh stop                 # 停止(いまの反復が終わってから)
#
# 環境変数:
#   MONKEY_UNTIL        終了時刻(必須)。"22:00" または "2026-11-08T06:00"。時刻だけで過去なら翌日とみなす
#   MONKEY_PERSONAS     選択候補の人格(空白区切り)。反復ごとにランダムに 1 つ選ぶ(直前と同じものは選ばない)。既定は全 7 本
#   MONKEY_STEPS        1 セッションの step 数(既定 20)
#   MONKEY_ITER_TIMEOUT 1 反復の上限秒(既定 3600)
#   MONKEY_MIN_ITER     残り時間がこれを切ったら新しい反復を始めない(既定 1500。短いと環境確認だけで終わる)
#   MONKEY_PAUSE        反復間の待ち秒(既定 20)
#   MONKEY_PARALLEL     同時に走らせる人格の数(既定 1。3 程度まで。同じ人格は同時に走らせない)
#   MONKEY_LOG_DIR      ログ置き場(既定 logs/monkey)。反復ごとに <日時>-<人格>/ を作る。stop ファイルもここ
#   MONKEY_MODEL        claude -p に渡すモデル(既定 opus。Fable はトリアージとレビューに取っておく)
#   MONKEY_EFFORT       claude -p に渡す effort(未指定なら既定)
set -u
cd "$(dirname "$0")/.."
ROOT=$PWD

LOG_DIR="${MONKEY_LOG_DIR:-logs/monkey}"
STOP_FILE="$LOG_DIR/stop"

if [ "${1:-}" = "stop" ]; then
  mkdir -p "$LOG_DIR"; touch "$STOP_FILE"
  pgrep -f '[m]onkey-loop\.sh$' >/dev/null \
    && echo "停止を指示しました。走っているセッションが終わったら終了します(即座に止めるなら実行中の端末で Ctrl+C)" \
    || echo "停止を指示しました($STOP_FILE)。ただし動いているループは見つかりませんでした"
  exit 0
fi

UNTIL="${MONKEY_UNTIL:?MONKEY_UNTIL を指定してください(例: MONKEY_UNTIL=22:00)}"
PERSONAS="${MONKEY_PERSONAS:-first-timer impatient-learner error-prone-learner phone-learner term-tapper tab-and-data-fiddler content-auditor}"
STEPS="${MONKEY_STEPS:-20}"
ITER_TIMEOUT="${MONKEY_ITER_TIMEOUT:-3600}"
MIN_ITER="${MONKEY_MIN_ITER:-1500}"
PAUSE="${MONKEY_PAUSE:-20}"
PARALLEL="${MONKEY_PARALLEL:-1}"
MODEL="${MONKEY_MODEL:-opus}"
EFFORT="${MONKEY_EFFORT:-}"
mkdir -p "$LOG_DIR"; rm -f "$STOP_FILE"

deadline=$(date -d "$UNTIL" +%s) || exit 1
if [ "$deadline" -le "$(date +%s)" ] && [[ "$UNTIL" != *-* ]]; then deadline=$(date -d "tomorrow $UNTIL" +%s); fi
echo "終了予定: $(date -d "@$deadline" '+%Y-%m-%d %H:%M') / 人格: $PERSONAS / step: $STEPS / 並列: $PARALLEL / モデル: ${MODEL:-既定} / ログ: $LOG_DIR"

for cmd in claude gh node docker; do command -v "$cmd" >/dev/null || { echo "$cmd が見つかりません"; exit 1; }; done
scripts/services.sh up || exit 1

# Monkey に使わせない操作。起票とコメント以外で GitHub と git の状態を変えさせない。
DISALLOWED=(
  "Bash(git push:*)" "Bash(git commit:*)" "Bash(git checkout:*)" "Bash(git switch:*)" "Bash(git reset:*)" "Bash(git stash:*)"
  "Bash(gh issue close:*)" "Bash(gh issue delete:*)" "Bash(gh issue edit:*)" "Bash(gh pr:*)" "Bash(gh repo:*)"
  "Bash(pnpm db:reset:*)" "Bash(pnpm db:stop:*)" "Bash(supabase:*)" "Bash(npx supabase:*)"
)

read -r -a persona_list <<<"$PERSONAS"

# 1 人格ぶんのセッションを起動する(フォアグラウンドで claude -p を待つ)。並列実行では & で呼ぶ。
#   run_session <人格> <セッションのディレクトリ> <上限秒>
run_session() {
  local persona=$1 session=$2 limit=$3 cutoff
  # 打ち切られると最後のまとめ(再現確認と起票)が失われるので、締め切りを伝えて自分で巻かせる。
  cutoff=$(date -d "@$(( $(date +%s) + limit ))" '+%H:%M')
  local prompt="Skill ツールで monkey-test を引数「$persona $STEPS」で起動し、その手順どおりにセッションを 1 回だけ実行してください。\
セッションのディレクトリは $ROOT/$session です(環境変数 MONKEY_SESSION_DIR にも入っています)。\
ユーザーへの質問はできないので、判断は自分で行ってください。この反復は $cutoff に強制終了されます。\
\`date\` で時刻を確認し、残り 12 分を切ったら新しい step を始めず、異常の再現確認・重複確認・起票・要約に入ってください。\
他の人格のセッションが同時に動いていることがあるので、起票の直前にもう一度 \`gh issue list\` で重複を確かめてください。\
終わったら、異常の一覧と起票した Issue 番号を要約して出力し、終了してください。"
  MONKEY_SESSION_DIR="$ROOT/$session" timeout --foreground -k 30 "$limit" \
    claude -p "$prompt" \
      ${MODEL:+--model "$MODEL"} ${EFFORT:+--effort "$EFFORT"} \
      --permission-mode acceptEdits \
      --allowedTools "mcp__playwright,Bash,Read,Write,Edit,Skill,Glob,Grep" \
      --disallowedTools "${DISALLOWED[@]}" \
      --mcp-config scripts/monkey-mcp.json --strict-mcp-config \
      >"$session/session.log" 2>&1
}

# いま動いていない人格を 1 つ選ぶ(直前に終わった人格も避ける)。候補が無ければ空。
pick_persona() {
  local candidates=() p
  for p in "${persona_list[@]}"; do
    case " ${active_personas[*]:-} $last_finished " in *" $p "*) continue ;; esac
    candidates+=("$p")
  done
  [ "${#candidates[@]}" -gt 0 ] || candidates=("${persona_list[@]}")
  echo "${candidates[$((RANDOM % ${#candidates[@]}))]}"
}

# 終了したセッションの後始末。戻り値 0 続行 / 1 停止 / 2 利用上限
finish_session() {
  local rc=$1 session=$2
  if scripts/claude-usage-limit.sh limited "$session/session.log"; then echo "利用上限に達しました($session/session.log)"; return 2; fi
  if [ "$rc" -eq 124 ]; then echo "[$(date '+%H:%M:%S')] $session は上限時間で打ち切られました"; fails=0
  elif [ "$rc" -ne 0 ]; then
    fails=$((fails + 1)); echo "[$(date '+%H:%M:%S')] $session: claude が終了コード $rc で失敗しました($fails 回連続)"
    [ "$fails" -lt 3 ] || { echo "3 回連続で失敗したため終了します"; return 1; }
  else fails=0; fi
  i=$((i + 1))
  return 0
}

# PARALLEL 本までセッションを同時に走らせる。pids / sessions / active_personas は同じ添字で対応する。
declare -a pids=() sessions=() active_personas=()
i=0 fails=0 last_finished=""
stop_reason=""
while :; do
  now=$(date +%s)
  remaining=$((deadline - now))
  if [ -z "$stop_reason" ]; then
    if [ "$remaining" -lt "$MIN_ITER" ]; then stop_reason="終了時刻です(残り ${remaining}s は 1 反復に足りません)"
    elif [ -e "$STOP_FILE" ]; then stop_reason="stop ファイルを検出しました"; fi
  fi
  # 空いた枠を埋める(停止が決まっていれば埋めない)
  while [ -z "$stop_reason" ] && [ "${#pids[@]}" -lt "$PARALLEL" ]; do
    persona=$(pick_persona)
    limit=$(( remaining < ITER_TIMEOUT ? remaining : ITER_TIMEOUT ))
    session="$LOG_DIR/$(date +%Y%m%d-%H%M%S)-$persona"
    mkdir -p "$session"
    echo "[$(date '+%H:%M:%S')] 開始 $((i + ${#pids[@]} + 1)): $persona ($STEPS step, 上限 ${limit}s, 並列 $((${#pids[@]} + 1))/$PARALLEL) -> $session/"
    run_session "$persona" "$session" "$limit" &
    pids+=($!); sessions+=("$session"); active_personas+=("$persona")
    sleep 2  # ディレクトリ名(秒)の衝突を避ける
  done
  [ "${#pids[@]}" -gt 0 ] || break
  # どれかが終わるまで待つ
  wait -n "${pids[@]}" 2>/dev/null
  # 終わったものを回収する
  for idx in "${!pids[@]}"; do
    if ! kill -0 "${pids[$idx]}" 2>/dev/null; then
      wait "${pids[$idx]}"; rc=$?
      finish_session "$rc" "${sessions[$idx]}"; frc=$?
      last_finished="${active_personas[$idx]}"
      unset 'pids[idx]' 'sessions[idx]' 'active_personas[idx]'
      pids=("${pids[@]}"); sessions=("${sessions[@]}"); active_personas=("${active_personas[@]}")
      case $frc in
        1) stop_reason="連続失敗" ;;
        2) # 利用上限: 走っているものを待ち切ってから、リセットまで待つ
           wait "${pids[@]}" 2>/dev/null; pids=() sessions=() active_personas=()
           scripts/claude-usage-limit.sh wait $((deadline - MIN_ITER)) "$STOP_FILE" || stop_reason="利用上限が解除されませんでした" ;;
      esac
      break
    fi
  done
  [ -n "$stop_reason" ] && [ "${#pids[@]}" -eq 0 ] && break
  [ -z "$stop_reason" ] && sleep "$PAUSE"
done
[ -n "$stop_reason" ] && echo "$stop_reason"
echo "反復回数: $i。ログは $LOG_DIR/"

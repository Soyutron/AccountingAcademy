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
#   MONKEY_LOG_DIR      ログ置き場(既定 logs/monkey)。反復ごとに <日時>-<人格>/ を作る。stop ファイルもここ
#   MONKEY_MODEL        claude -p に渡すモデル(未指定なら Claude Code の既定)
#   MONKEY_EFFORT       claude -p に渡す effort(未指定なら既定)
set -u
cd "$(dirname "$0")/.."
ROOT=$PWD

LOG_DIR="${MONKEY_LOG_DIR:-logs/monkey}"
STOP_FILE="$LOG_DIR/stop"

if [ "${1:-}" = "stop" ]; then
  mkdir -p "$LOG_DIR"; touch "$STOP_FILE"
  pgrep -f '[m]onkey-loop\.sh$' >/dev/null \
    && echo "停止を指示しました。いまの反復が終わったら終了します(即座に止めるなら実行中の端末で Ctrl+C)" \
    || echo "停止を指示しました($STOP_FILE)。ただし動いているループは見つかりませんでした"
  exit 0
fi

UNTIL="${MONKEY_UNTIL:?MONKEY_UNTIL を指定してください(例: MONKEY_UNTIL=22:00)}"
PERSONAS="${MONKEY_PERSONAS:-first-timer impatient-learner error-prone-learner phone-learner term-tapper tab-and-data-fiddler content-auditor}"
STEPS="${MONKEY_STEPS:-20}"
ITER_TIMEOUT="${MONKEY_ITER_TIMEOUT:-3600}"
MIN_ITER="${MONKEY_MIN_ITER:-1500}"
PAUSE="${MONKEY_PAUSE:-20}"
MODEL="${MONKEY_MODEL:-}"
EFFORT="${MONKEY_EFFORT:-}"
mkdir -p "$LOG_DIR"; rm -f "$STOP_FILE"

deadline=$(date -d "$UNTIL" +%s) || exit 1
if [ "$deadline" -le "$(date +%s)" ] && [[ "$UNTIL" != *-* ]]; then deadline=$(date -d "tomorrow $UNTIL" +%s); fi
echo "終了予定: $(date -d "@$deadline" '+%Y-%m-%d %H:%M') / 人格: $PERSONAS / step: $STEPS / モデル: ${MODEL:-既定} / ログ: $LOG_DIR"

for cmd in claude gh node docker; do command -v "$cmd" >/dev/null || { echo "$cmd が見つかりません"; exit 1; }; done
scripts/services.sh up || exit 1

# Monkey に使わせない操作。起票とコメント以外で GitHub と git の状態を変えさせない。
DISALLOWED=(
  "Bash(git push:*)" "Bash(git commit:*)" "Bash(git checkout:*)" "Bash(git switch:*)" "Bash(git reset:*)" "Bash(git stash:*)"
  "Bash(gh issue close:*)" "Bash(gh issue delete:*)" "Bash(gh issue edit:*)" "Bash(gh pr:*)" "Bash(gh repo:*)"
  "Bash(pnpm db:reset:*)" "Bash(pnpm db:stop:*)" "Bash(supabase:*)" "Bash(npx supabase:*)"
)

read -r -a persona_list <<<"$PERSONAS"
i=0 fails=0 prev=""
while :; do
  now=$(date +%s)
  remaining=$((deadline - now))
  if [ "$remaining" -lt "$MIN_ITER" ]; then echo "終了時刻です(残り ${remaining}s は 1 反復に足りません)"; break; fi
  if [ -e "$STOP_FILE" ]; then echo "stop ファイルを検出しました"; break; fi

  while :; do
    persona="${persona_list[$((RANDOM % ${#persona_list[@]}))]}"
    if [ "${#persona_list[@]}" -eq 1 ] || [ "$persona" != "$prev" ]; then break; fi
  done
  prev=$persona
  limit=$(( remaining < ITER_TIMEOUT ? remaining : ITER_TIMEOUT ))
  session="$LOG_DIR/$(date +%Y%m%d-%H%M%S)-$persona"
  mkdir -p "$session"
  echo "[$(date '+%H:%M:%S')] 反復 $((i + 1)): $persona ($STEPS step, 上限 ${limit}s) -> $session/"

  # 打ち切られると最後のまとめ(再現確認と起票)が失われるので、締め切りを伝えて自分で巻かせる。
  cutoff=$(date -d "@$((now + limit))" '+%H:%M')
  prompt="Skill ツールで monkey-test を引数「$persona $STEPS」で起動し、その手順どおりにセッションを 1 回だけ実行してください。\
セッションのディレクトリは $ROOT/$session です(環境変数 MONKEY_SESSION_DIR にも入っています)。\
ユーザーへの質問はできないので、判断は自分で行ってください。この反復は $cutoff に強制終了されます。\
\`date\` で時刻を確認し、残り 12 分を切ったら新しい step を始めず、異常の再現確認・重複確認・起票・要約に入ってください。\
終わったら、異常の一覧と起票した Issue 番号を要約して出力し、終了してください。"

  MONKEY_SESSION_DIR="$ROOT/$session" timeout --foreground -k 30 "$limit" \
    claude -p "$prompt" \
      ${MODEL:+--model "$MODEL"} ${EFFORT:+--effort "$EFFORT"} \
      --permission-mode acceptEdits \
      --allowedTools "mcp__playwright,Bash,Read,Write,Edit,Skill,Glob,Grep" \
      --disallowedTools "${DISALLOWED[@]}" \
      --mcp-config scripts/monkey-mcp.json --strict-mcp-config \
      >"$session/session.log" 2>&1
  rc=$?

  if scripts/claude-usage-limit.sh limited "$session/session.log"; then
    echo "利用上限に達しました($session/session.log)"
    scripts/claude-usage-limit.sh wait $((deadline - MIN_ITER)) "$STOP_FILE" || break
    continue
  fi
  if [ "$rc" -eq 124 ]; then
    echo "反復が上限時間で打ち切られました"; fails=0
  elif [ "$rc" -ne 0 ]; then
    fails=$((fails + 1)); echo "claude が終了コード $rc で失敗しました($fails 回連続)"
    if [ "$fails" -ge 3 ]; then echo "3 回連続で失敗したため終了します"; break; fi
  else
    fails=0
  fi
  i=$((i + 1))
  sleep "$PAUSE"
done
echo "反復回数: $i。ログは $LOG_DIR/"

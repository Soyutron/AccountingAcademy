#!/usr/bin/env bash
# ready-for-agentのIssueを古い順に1件ずつscripts/issue-agent.shで処理し続ける。
# 骨格はmonkey-loopと同じ(終了時刻、stopファイル、連続失敗で停止、利用上限はリセットまで待つ)。設計はdocs/quality-loop.md §4.4。
#
#   ISSUE_UNTIL=06:00 scripts/issue-loop.sh   # 開始
#   scripts/issue-loop.sh stop                # 停止(いまのIssueが終わってから)
#
# 環境変数:
#   ISSUE_UNTIL      終了時刻(必須)。残りがISSUE_PHASE_TIMEOUT(既定3600秒)を切ったら新しいIssueを始めない
#   ISSUE_LABEL      対象ラベル(既定ready-for-agent)
#   ISSUE_MAX_FAILS  Issue固有の失敗(終了コード3〜4)がこの回数連続したら停止(既定3)。人手待ち(2)は数えない
#   ISSUE_PAUSE      反復間の待ち秒(既定20)
#   ISSUE_PARALLEL   同時に処理するIssueの数(既定1。3程度まで。mainへの統合はissue-agent側で1件ずつ)
#   ISSUE_WAIT=1     対象のIssueが無くても終了時刻まで待つ(トリアージと並走させるとき)
#   ISSUE_LOG_DIR    ログ置き場(既定logs/issue-agent)
#   そのほかissue-agent.shの環境変数はそのまま渡る
set -u
cd "$(dirname "$0")/.."
LOG_DIR="${ISSUE_LOG_DIR:-logs/issue-agent}"
STOP_FILE="$LOG_DIR/stop"

if [ "${1:-}" = "stop" ]; then
  mkdir -p "$LOG_DIR"; touch "$STOP_FILE"
  pgrep -f '[i]ssue-loop\.sh$' >/dev/null \
    && echo "停止を指示しました。いまのIssueが終わったら終了します" \
    || echo "停止を指示しました($STOP_FILE)。ただし動いているループは見つかりませんでした"
  exit 0
fi

UNTIL="${ISSUE_UNTIL:?ISSUE_UNTILを指定してください(例: ISSUE_UNTIL=06:00)}"
LABEL="${ISSUE_LABEL:-ready-for-agent}"
MAX_FAILS="${ISSUE_MAX_FAILS:-3}"
PAUSE="${ISSUE_PAUSE:-20}"
PARALLEL="${ISSUE_PARALLEL:-1}"
# 1件の実測は4〜7分なので、残りがこれを切ったら新しいIssueを始めない(処理中のものは最後まで行う)
MARGIN="${ISSUE_MARGIN:-900}"
mkdir -p "$LOG_DIR"; rm -f "$STOP_FILE"

deadline=$(date -d "$UNTIL" +%s) || exit 1
if [ "$deadline" -le "$(date +%s)" ] && [[ "$UNTIL" != *-* ]]; then deadline=$(date -d "tomorrow $UNTIL" +%s); fi
echo "終了予定: $(date -d "@$deadline" '+%Y-%m-%d %H:%M') / ラベル: $LABEL / 並列: $PARALLEL / ログ: $LOG_DIR"

# 対象ラベルが付いていて、誰も触っておらず、ブロッカーが無いものを古い順に1件。
# 起票直後でagent:in-progressがまだ付いていないIssueはissue-agentのロック(Issueごと)で見分ける。
next_issue() {
  local n
  for n in $(gh api --paginate "repos/{owner}/{repo}/issues?state=open&labels=$LABEL&per_page=100&sort=created&direction=asc" \
    --jq '[ .[]
            | select(.pull_request == null)
            | select(([.labels[].name] | any(startswith("agent:") or . == "needs-info" or . == "ready-for-human" or . == "wontfix")) | not)
            | select((.assignees | length) == 0)
            | select((.issue_dependencies_summary.blocked_by // 0) == 0)
          ] | sort_by(.number) | .[].number'); do
    if [ -e "$LOG_DIR/$n/lock" ] && ! flock -n "$LOG_DIR/$n/lock" true; then continue; fi
    echo "$n"; return
  done
}

# PARALLEL本までissue-agentを同時に走らせる。pids / issues / slotsは同じ添字で対応し、slotがE2Eのポート(3100 + slot)を決める。
declare -a pids=() issues=() slots=()
i=0 fails=0 merged=0 skipped=0 offtarget=0 processed=" " stop_reason=""
free_slot() { local k; for ((k = 0; k < PARALLEL; k++)); do case " ${slots[*]-} " in *" $k "*) ;; *) echo "$k"; return ;; esac; done; }
while :; do
  if [ -z "$stop_reason" ]; then
    if [ $((deadline - $(date +%s))) -lt "$MARGIN" ]; then stop_reason="終了時刻です"
    elif [ -e "$STOP_FILE" ]; then stop_reason="stopファイルを検出しました"; fi
  fi
  # 空いた枠を埋める(停止が決まっていれば埋めない)
  while [ -z "$stop_reason" ] && [ "${#pids[@]}" -lt "$PARALLEL" ]; do
    n=$(next_issue)
    if [ -z "$n" ]; then
      if [ "${#pids[@]}" -eq 0 ] && [ "${ISSUE_WAIT:-0}" != 1 ]; then stop_reason="対象のIssueがありません(ラベル$LABEL)"; fi
      break
    fi
    # 統合済みのIssueがまた選ばれるのはラベルやcloseが効いていないときだけ(needs-humanを人が外した取り直しは通す)
    case "$processed" in *" $n "*) stop_reason="統合済みのIssue #${n}がまた選ばれました(ラベルを更新できていない可能性があります)"; break ;; esac
    slot=$(free_slot)
    echo "[$(date '+%H:%M:%S')]反復$((i + 1)): Issue #$n(並列$((${#pids[@]} + 1))/$PARALLEL、E2Eポート$((3100 + slot)))"
    ( set -o pipefail; ISSUE_E2E_PORT=$((3100 + slot)) scripts/issue-agent.sh "$n" 2>&1 | sed -u "s/^/[#$n] /" ) &
    pids+=($!); issues+=("$n"); slots+=("$slot"); i=$((i + 1))
    sleep 5  # 次の選択までにissue-agentがロックとラベルを取れるようにする
  done
  if [ "${#pids[@]}" -eq 0 ]; then
    # ISSUE_WAIT=1なら対象が増えるまで待つ(トリアージがready-for-agentを付けるのを待つ)
    [ -z "$stop_reason" ] && [ "${ISSUE_WAIT:-0}" = 1 ] && { sleep "$PAUSE"; continue; }
    break
  fi
  wait -n "${pids[@]}" 2>/dev/null
  # 終わったものを回収する
  for idx in "${!pids[@]}"; do
    kill -0 "${pids[$idx]}" 2>/dev/null && continue
    wait "${pids[$idx]}"; rc=$?; n="${issues[$idx]}"
    unset 'pids[idx]' 'issues[idx]' 'slots[idx]'
    pids=("${pids[@]}"); issues=("${issues[@]}"); slots=("${slots[@]}")
    case $rc in
      7) # 利用上限: 走っているものを待ち切ってから、リセットまで待って同じIssueを取り直す
         wait "${pids[@]}" 2>/dev/null; pids=() issues=() slots=()
         scripts/claude-usage-limit.sh wait $((deadline - MARGIN)) "$STOP_FILE" || stop_reason="利用上限が解除されませんでした" ;;
      0) fails=0 offtarget=0; merged=$((merged + 1)); processed="$processed$n " ;;
      2) skipped=$((skipped + 1)); echo "Issue #${n}は人手が必要と判断されました。次へ進みます" ;;
      6) skipped=$((skipped + 1)); offtarget=$((offtarget + 1)); echo "Issue #${n}は対象外でした(別のワーカーが処理中など)。次へ進みます"
         [ "$offtarget" -lt 5 ] || stop_reason="対象外のIssueが5回続いたため終了します(ghの一覧とラベルが食い違っている可能性があります)" ;;
      5) stop_reason="環境の問題で停止します(終了コード5)" ;;
      *) fails=$((fails + 1)); echo "Issue #${n}は終了コード${rc}で失敗しました(${fails}回連続)"
         [ "$fails" -lt "$MAX_FAILS" ] || stop_reason="${MAX_FAILS}回連続で失敗したため終了します" ;;
    esac
    break
  done
  [ -n "$stop_reason" ] && [ "${#pids[@]}" -eq 0 ] && break
  [ -z "$stop_reason" ] && sleep "$PAUSE"
done
[ -n "$stop_reason" ] && echo "$stop_reason"
echo "反復回数: $i、統合: ${merged}件、スキップ: ${skipped}件。ログは$LOG_DIR/"

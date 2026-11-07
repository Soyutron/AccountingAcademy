#!/usr/bin/env bash
# ready-for-agent の Issue を古い順に 1 件ずつ scripts/issue-agent.sh で処理し続ける。
# 骨格は monkey-loop と同じ(終了時刻、stop ファイル、連続失敗で停止、利用上限はリセットまで待つ)。設計は docs/quality-loop.md §4.4。
#
#   ISSUE_UNTIL=06:00 scripts/issue-loop.sh   # 開始
#   scripts/issue-loop.sh stop                # 停止(いまの Issue が終わってから)
#
# 環境変数:
#   ISSUE_UNTIL      終了時刻(必須)。残りが ISSUE_PHASE_TIMEOUT(既定 3600 秒)を切ったら新しい Issue を始めない
#   ISSUE_LABEL      対象ラベル(既定 ready-for-agent)
#   ISSUE_MAX_FAILS  Issue 固有の失敗(終了コード 3〜4)がこの回数連続したら停止(既定 3)。人手待ち(2)は数えない
#   ISSUE_PAUSE      反復間の待ち秒(既定 20)
#   ISSUE_LOG_DIR    ログ置き場(既定 logs/issue-agent)
#   そのほか issue-agent.sh の環境変数はそのまま渡る
set -u
cd "$(dirname "$0")/.."
LOG_DIR="${ISSUE_LOG_DIR:-logs/issue-agent}"
STOP_FILE="$LOG_DIR/stop"

if [ "${1:-}" = "stop" ]; then
  mkdir -p "$LOG_DIR"; touch "$STOP_FILE"
  pgrep -f '[i]ssue-loop\.sh$' >/dev/null \
    && echo "停止を指示しました。いまの Issue が終わったら終了します" \
    || echo "停止を指示しました($STOP_FILE)。ただし動いているループは見つかりませんでした"
  exit 0
fi

UNTIL="${ISSUE_UNTIL:?ISSUE_UNTIL を指定してください(例: ISSUE_UNTIL=06:00)}"
LABEL="${ISSUE_LABEL:-ready-for-agent}"
MAX_FAILS="${ISSUE_MAX_FAILS:-3}"
PAUSE="${ISSUE_PAUSE:-20}"
# 1 件の実測は 4〜7 分なので、残りがこれを切ったら新しい Issue を始めない(処理中のものは最後まで行う)
MARGIN="${ISSUE_MARGIN:-900}"
mkdir -p "$LOG_DIR"; rm -f "$STOP_FILE"

deadline=$(date -d "$UNTIL" +%s) || exit 1
if [ "$deadline" -le "$(date +%s)" ] && [[ "$UNTIL" != *-* ]]; then deadline=$(date -d "tomorrow $UNTIL" +%s); fi
echo "終了予定: $(date -d "@$deadline" '+%Y-%m-%d %H:%M') / ラベル: $LABEL / ログ: $LOG_DIR"

# 対象ラベルが付いていて、誰も触っておらず、ブロッカーが無いものを古い順に 1 件。
next_issue() {
  gh api --paginate "repos/{owner}/{repo}/issues?state=open&labels=$LABEL&per_page=100&sort=created&direction=asc" \
    --jq '[ .[]
            | select(.pull_request == null)
            | select(([.labels[].name] | any(startswith("agent:") or . == "needs-info" or . == "ready-for-human" or . == "wontfix")) | not)
            | select((.assignees | length) == 0)
            | select((.issue_dependencies_summary.blocked_by // 0) == 0)
          ] | sort_by(.number) | .[0].number // empty' | head -n 1
}

i=0 fails=0 merged=0 skipped=0 processed=" "
while :; do
  remaining=$((deadline - $(date +%s)))
  if [ "$remaining" -lt "$MARGIN" ]; then echo "終了時刻です"; break; fi
  if [ -e "$STOP_FILE" ]; then echo "stop ファイルを検出しました"; break; fi
  n=$(next_issue)
  if [ -z "$n" ]; then echo "対象の Issue がありません(ラベル $LABEL)"; break; fi
  case "$processed" in *" $n "*) echo "Issue #$n がまた選ばれました(ラベルを更新できていない可能性があります)。停止します"; break ;; esac

  echo "[$(date '+%H:%M:%S')] 反復 $((i + 1)): Issue #$n"
  scripts/issue-agent.sh "$n"; rc=$?
  if [ "$rc" -eq 7 ]; then scripts/claude-usage-limit.sh wait $((deadline - MARGIN)) "$STOP_FILE" || break; continue; fi
  processed="$processed$n "
  case $rc in
    0) fails=0; merged=$((merged + 1)) ;;
    2) skipped=$((skipped + 1)); echo "Issue #$n は人手が必要と判断されました。次へ進みます" ;;
    6) skipped=$((skipped + 1)); echo "Issue #$n は対象外でした。次へ進みます" ;;
    5) echo "環境の問題で停止します(終了コード 5)"; break ;;
    *) fails=$((fails + 1)); echo "Issue #$n は終了コード $rc で失敗しました($fails 回連続)"
       if [ "$fails" -ge "$MAX_FAILS" ]; then echo "$MAX_FAILS 回連続で失敗したため終了します"; break; fi ;;
  esac
  i=$((i + 1)); sleep "$PAUSE"
done
echo "反復回数: $i、統合: $merged 件、スキップ: $skipped 件。ログは $LOG_DIR/"

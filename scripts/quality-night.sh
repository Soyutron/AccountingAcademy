#!/usr/bin/env bash
# 夜間の品質改善ループ。探索(Monkey)→ 自動トリアージ → 修正(issue-agent)を順に回す。設計は docs/quality-loop.md §4.6。
#
#   QUALITY_UNTIL=06:00 scripts/quality-night.sh
#
# 環境変数:
#   QUALITY_UNTIL        全体の終了時刻(必須)
#   QUALITY_MONKEY_SHARE Monkey に使う時間の割合(既定 0.4。残りをトリアージと修正に回す)
#   そのほか MONKEY_* / ISSUE_* / TRIAGE_* はそれぞれのスクリプトへ渡る
set -u
cd "$(dirname "$0")/.."
UNTIL="${QUALITY_UNTIL:?QUALITY_UNTIL を指定してください(例: QUALITY_UNTIL=06:00)}"
SHARE="${QUALITY_MONKEY_SHARE:-0.4}"
deadline=$(date -d "$UNTIL" +%s) || exit 1
if [ "$deadline" -le "$(date +%s)" ] && [[ "$UNTIL" != *-* ]]; then deadline=$(date -d "tomorrow $UNTIL" +%s); fi
now=$(date +%s)
monkey_until=$(python3 -c "print(int($now + ($deadline - $now) * $SHARE))")
echo "== 全体の終了: $(date -d "@$deadline" '+%m-%d %H:%M') / Monkey は $(date -d "@$monkey_until" '+%H:%M') まで"

echo "== 1a. seed 付き Monkey"
scripts/monkey-scripted.sh
echo "== 1b. 人格型 Monkey"
MONKEY_UNTIL=$(date -d "@$monkey_until" '+%Y-%m-%dT%H:%M') scripts/monkey-loop.sh
echo "== 2. トリアージ"
scripts/triage-agent.sh loop
echo "== 3. 修正"
ISSUE_UNTIL=$(date -d "@$deadline" '+%Y-%m-%dT%H:%M') scripts/issue-loop.sh
echo "== 終了。状況: scripts/issue-agent.sh status"
scripts/issue-agent.sh status

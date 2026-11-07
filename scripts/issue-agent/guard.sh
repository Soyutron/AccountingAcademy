#!/usr/bin/env bash
# 無人セッション(issue-agent / triage-agent)の PreToolUse フック。Bash のコマンド文字列を検査し、
# git の統合系・push、Issue の状態変更、Supabase の操作を含むものを拒否する(終了コード 2 = ブロック)。
# --disallowedTools の Bash(...) は前方一致で `cd x && git push` を素通りするため、ここで文字列全体を見る。
# GUARD_WRITE_DIR があれば、Write / Edit はそのディレクトリ配下だけに許す(トリアージなど読み取り専用のセッション用)。
set -u
input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // ""')
if [ -n "${GUARD_WRITE_DIR:-}" ] && printf '%s' "$tool" | grep -qE '^(Write|Edit|MultiEdit|NotebookEdit)$'; then
  file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // ""')
  case "$file" in "$GUARD_WRITE_DIR"/*) exit 0 ;; *) echo "このセッションで書いてよいのは $GUARD_WRITE_DIR/ 配下だけです: $file" >&2; exit 2 ;; esac
fi
[ "$tool" = "Bash" ] || exit 0
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
DENY='(^|[^[:alnum:]_-])(git[[:space:]]+(push|merge|rebase|checkout|switch|worktree|reset[[:space:]]+--hard|branch[[:space:]]+-D)|gh[[:space:]]+(issue[[:space:]]+(close|delete|edit|reopen)|pr|repo|api)|supabase[[:space:]]|pnpm[[:space:]]+db:(reset|stop)|npx[[:space:]]+supabase)([^[:alnum:]_-]|$)'
if printf '%s' "$cmd" | grep -qE "$DENY"; then
  echo "このセッションでは許可されていない操作です(統合・push・Issue の状態変更・Supabase の操作はスクリプトが行います): $cmd" >&2
  exit 2
fi
exit 0

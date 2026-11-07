#!/usr/bin/env bash
# ローカルの品質確認を一括で回す(ADR 0005)。issue-agent の関門と、実装側の Claude が使う。
#   scripts/check.sh            # lint / typecheck / test / build / E2E
#   CHECK_E2E=0 scripts/check.sh # E2E を省く
# E2E は本番ビルドを E2E_PORT(既定 3100。開発サーバーの 3000 と並走できる)で起動して回す。
set -eu
cd "$(dirname "$0")/.."
echo "[check] lint"; pnpm lint
echo "[check] typecheck"; pnpm typecheck
echo "[check] test"; pnpm test
echo "[check] build"; pnpm build
if [ "${CHECK_E2E:-1}" = 1 ]; then
  echo "[check] e2e (port ${E2E_PORT:-3100})"
  E2E_SERVER=start E2E_PORT="${E2E_PORT:-3100}" pnpm exec playwright test
fi
echo "[check] ok"

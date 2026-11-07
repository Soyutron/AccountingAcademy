import { defineConfig } from "@playwright/test";

// E2E はローカル Supabase(pnpm db:start)に対して実行する。
// ローカルでは開発サーバー(3000)を使い回す。CI と issue-agent の関門(E2E_SERVER=start)では本番ビルドを使う
// (開発サーバーのページごとのコンパイルが遅く、タイムアウトの原因になるため)。ポートは E2E_PORT で変えられる(worktree で並走するため)。
const ci = Boolean(process.env.CI);
const port = Number(process.env.E2E_PORT ?? 3000);
const prod = ci || process.env.E2E_SERVER === "start";

export default defineConfig({
  testDir: "e2e",
  timeout: prod ? 180_000 : 60_000,
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    // 関門では scripts/check.sh がビルド済みなので start だけ。CI はビルドから
    command: ci ? `pnpm build && pnpm start -p ${port}` : prod ? `pnpm start -p ${port}` : "pnpm dev",
    url: `http://localhost:${port}`,
    reuseExistingServer: !prod,
    timeout: 300_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});

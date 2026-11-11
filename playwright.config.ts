import { defineConfig } from "@playwright/test";

// E2EはローカルSupabase(pnpm db:start)に対して実行する。
// ローカルでは開発サーバー(3000)を使い回す。CIとissue-agentの関門(E2E_SERVER=start)では本番ビルドを使う
// (開発サーバーのページごとのコンパイルが遅く、タイムアウトの原因になるため)。ポートはE2E_PORTで変えられる(worktreeで並走するため)。
const ci = Boolean(process.env.CI);
const port = Number(process.env.E2E_PORT ?? 3000);
const prod = ci || process.env.E2E_SERVER === "start";

export default defineConfig({
  testDir: "e2e",
  timeout: prod ? 180_000 : 60_000,
  // 関門はissue-loopの並列ワーカーやトリアージと同時に走るので、ブラウザの並列数を抑え、負荷由来の1回きりの失敗は再試行で吸収する
  workers: prod ? 4 : undefined,
  retries: prod ? 1 : 0,
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    // 関門ではscripts/check.shがビルド済みなのでstartだけ。CIはビルドから
    command: ci ? `pnpm build && pnpm start -p ${port}` : prod ? `pnpm start -p ${port}` : "pnpm dev",
    url: `http://localhost:${port}`,
    reuseExistingServer: !prod,
    timeout: 300_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});

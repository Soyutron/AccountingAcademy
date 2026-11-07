import { defineConfig } from "@playwright/test";

// E2E はローカル Supabase(pnpm db:start)に対して実行する。
// ローカルでは開発サーバーを使い回し、CI では本番ビルドを使う(開発サーバーのページごとのコンパイルが遅く、タイムアウトの原因になるため)
const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: "e2e",
  timeout: ci ? 180_000 : 60_000,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: ci ? "pnpm build && pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !ci,
    timeout: 300_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});

import { execSync } from "node:child_process";
import type { NextConfig } from "next";

// 回答ログに残すコンテンツの版。CI ではホストが与える SHA、ローカルでは git から取る
function contentVersion(): string {
  if (process.env.CONTENT_VERSION) return process.env.CONTENT_VERSION;
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "uncommitted";
  }
}

const nextConfig: NextConfig = {
  // ホスティング未決のため、どこでも動く standalone 出力にする(docs/architecture.md 7 章)
  output: "standalone",
  env: { NEXT_PUBLIC_CONTENT_VERSION: contentVersion() },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;

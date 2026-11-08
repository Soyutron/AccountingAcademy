import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 無人ループが書く操作スクリプトとログ
    "logs/**",
    // 並列セッションと夜間ループの worktree(別の作業ツリーなので main の lint 対象にしない)
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;

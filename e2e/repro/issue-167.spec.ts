import { expect, test } from "@playwright/test";
import fs from "node:fs";

// Issue #167: 常に表示されている損益計算書を、本文が「開いて」と言っていた
test("損益計算書は常に見えているので、本文は「開いて」と言わない", async () => {
  const src = fs.readFileSync(process.cwd() + "/.velite/units.json", "utf8");
  expect(src).not.toContain("「損益計算書」を開いて");
  expect(src).toContain("結果の「損益計算書」を見てみましょう");
});

// 開閉のUIが付いたら、本文の言い方を見直す合図になる
test("PC幅: 結果ペインの損益計算書に押せる要素が無い", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/units/bookkeeping-basics/five-elements");
  const section = page.getByRole("region", { name: "結果" }).locator('section[aria-label="損益計算書"]');
  await expect(section).toBeVisible();
  await expect(section.locator("button, a, summary, [role=tab], [role=button]")).toHaveCount(0);
});

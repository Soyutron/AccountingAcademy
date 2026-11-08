import { expect, test } from "@playwright/test";

test("「使い方」が仕分けボードと金額で答える課題を説明し、閉じるボタンが日本語", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "使い方" }).click();
  const help = page.getByRole("dialog", { name: "会計 IDE の使い方" });
  // 説明は分類ごとに畳まれているので、「課題の種類」を開いてから数える(docs/help-design.md)
  await help.getByText("課題の種類").click();
  await expect(help.locator("details[open] dt").filter({ hasText: /箱|仕分け/ })).toHaveCount(1);
  await expect(help.locator("details[open] dt").filter({ hasText: /金額|計算/ })).toHaveCount(1);
  await expect(help.getByRole("button", { name: "閉じる" })).toBeVisible();
});

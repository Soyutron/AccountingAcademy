import { expect, test } from "@playwright/test";

test("「使い方」が仕分けボードと金額で答える課題を説明し、閉じるボタンが日本語", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "使い方" }).click();
  const help = page.getByRole("dialog", { name: "会計 IDE の使い方" });
  await expect(help.locator("dt").filter({ hasText: /箱|仕分け/ })).toHaveCount(1);
  await expect(help.locator("dt").filter({ hasText: /金額|計算/ })).toHaveCount(1);
  await expect(help.getByRole("button", { name: "閉じる" })).toBeVisible();
});

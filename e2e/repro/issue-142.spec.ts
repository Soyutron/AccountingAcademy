import { expect, test } from "@playwright/test";

test("細かい支払いを任せる ステップ2の「小切手」は用語リンクになっている", async ({ page }) => {
  await page.goto("/units/cash-and-deposits/petty-cash");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 9")).toBeVisible();
  const guide = page.getByRole("region", { name: "ガイド" });
  await expect(guide.locator("button.term", { hasText: "小切手" }).first()).toBeVisible({ timeout: 3000 });
});

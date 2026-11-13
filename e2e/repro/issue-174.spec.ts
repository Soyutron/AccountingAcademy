import { expect, test } from "@playwright/test";

// Issue #174: 最初の単元の本文に、帳簿をつける目的と、1つの取引を左右に書く理由が無かった

test("導入が帳簿をつける目的に、ステップ2が原因と結果の両面を左右に書く理由に触れる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const guide = page.getByRole("region", { name: "ガイド" });
  await expect(guide.locator("p", { hasText: "帳簿をつけるのは" })).toContainText("いつでも確かめられる");

  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  const reason = guide.locator("p", { hasText: "2つの面" });
  await expect(reason).toContainText("原因");
  await expect(reason).toContainText("結果");
});

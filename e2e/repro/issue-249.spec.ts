import { expect, test } from "@playwright/test";

test("本文の「諸掛」の定義が、用語の定義と同じ範囲を指している", async ({ page }) => {
  const guide = page.getByRole("region", { name: "ガイド" });
  await page.goto("/units/merchandise/returns-and-costs");
  await page.getByRole("button", { name: "今はしない" }).click({ timeout: 8000 }).catch(() => {});
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await expect(page.getByText("ステップ 2 / 8")).toBeVisible();
  await expect(guide).toContainText("商品の売り買いにかかる運賃などを");
  await expect(guide).not.toContainText("商品を手に入れるまでにかかる運賃を");
  await guide.getByRole("button", { name: "諸掛" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("商品の売り買いにかかる");
});

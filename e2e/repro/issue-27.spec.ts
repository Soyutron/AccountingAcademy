import { expect, test } from "@playwright/test";

// Issue #27: 単元内の用語ポップオーバーの「詳しく」が、開いている単元自身を指していた
test("単元内の用語ポップオーバーに、その単元自身への「詳しく」リンクを出さない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("region", { name: "ガイド" }).getByRole("button", { name: "取引" }).first().click();
  await page.getByRole("button", { name: "もっと見る" }).click();
  const dialog = page.getByRole("dialog", { name: "取引" });
  await expect(dialog.getByText("この単元で学びます")).toBeVisible();
  await expect(dialog.locator('a[href="/units/bookkeeping-basics/five-elements"]')).toHaveCount(0);
});

test("別の単元で導入される用語には、従来どおり「詳しく」リンクを出す", async ({ page }) => {
  await page.goto("/units/depreciation/straight-line");
  await page.getByRole("region", { name: "ガイド" }).getByRole("button", { name: "減価償却" }).first().click();
  await page.getByRole("button", { name: "もっと見る" }).click();
  const dialog = page.getByRole("dialog", { name: "減価償却" });
  await expect(dialog.locator('a[href="/units/depreciation/what-is-depreciation"]')).toBeVisible();
});

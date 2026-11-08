import { expect, test } from "@playwright/test";

// calc で定義外の誤答(桁違い)に、仕訳の課題向けの「結果の表で何が動くはずか」が出る
test("calc の定義外の誤答に、結果の表の動きを問う文を出さない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto("/units/merchandise/cost-of-goods-sold");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 8")).toBeVisible();
  await work.getByPlaceholder("金額(円)").fill("1100000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();
  await expect(page.getByText("結果の表で何が動くはずか", { exact: false })).toHaveCount(0);
});

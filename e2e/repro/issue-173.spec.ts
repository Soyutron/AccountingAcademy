import { expect, test } from "@playwright/test";

// 本文が「▲ の印が付きました」と言うなら、その画面で増減の印が見えている
test("チュートリアル ステップ3の本文と増減の印が一致する", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  const dialog = page.getByRole("dialog", { name: "チュートリアル" });
  await dialog.getByRole("button", { name: "スキップ" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 4")).toBeVisible();
  const saysMark = await page.getByRole("region", { name: "ガイド" }).getByText("▲ の印が付きました").count();
  if (saysMark) {
    await expect(
      page.getByRole("region", { name: "結果" }).locator("section[aria-label='貸借対照表']").getByText("増加"),
    ).toHaveCount(2);
  }
});

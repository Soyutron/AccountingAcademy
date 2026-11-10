import { expect, test } from "@playwright/test";

// 問題文と同じ「30,000 円」の書き方(円の前に空白)でも金額として読める
test("金額に「30,000 円」と入れても記帳できる", async ({ page }) => {
  await page.goto("/units/merchandise/three-account-method");
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 7")).toBeVisible();
  await work.getByLabel("借方の科目 1").fill("仕入");
  await work.getByLabel("借方の金額 1").fill("30,000 円");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await work.getByLabel("貸方の金額 1").fill("30,000 円");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
});

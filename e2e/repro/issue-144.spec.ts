import { expect, test } from "@playwright/test";

// 売っても仕入は減らないので、成功文が「売れるまで」と言わないこと
test("仕入と売上 ステップ2: 成功文が売上時に仕入が減ると読めない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto("/units/merchandise/three-account-method");
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("仕入");
  await work.getByLabel("借方の金額1").fill("30000");
  await work.getByLabel("貸方の科目1").fill("現金");
  await work.getByLabel("貸方の金額1").fill("30000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "売れるまで" })).toHaveCount(0);
});

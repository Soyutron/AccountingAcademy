import { expect, test } from "@playwright/test";

test("仕入の右に売掛金と書くと、買掛金との取り違えを指摘する", async ({ page }) => {
  await page.goto("/units/merchandise/credit-transactions");
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目 1").fill("仕入");
  await work.getByLabel("借方の金額 1").fill("40000");
  await work.getByLabel("貸方の科目 1").fill("売掛金");
  await work.getByLabel("貸方の金額 1").fill("40000");
  await page.getByRole("button", { name: "記帳する" }).click();
  const status = page.getByRole("status");
  await expect(status.getByText("もう一歩")).toBeVisible();
  await expect(status).not.toContainText("まだ合っていません");
  await expect(status).toContainText("買掛金");
});

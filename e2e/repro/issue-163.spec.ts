import { expect, test } from "@playwright/test";

// 普通預金を現金と書く取り違えに、汎用文だけが出ていた(貸したお金、借りたお金 ステップ2)
test("貸付金 / 現金 の仕訳に、普通預金との違いを指す説明が出る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto("/units/receivables-and-payables/loans");
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("貸付金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("現金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("もう一歩", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).not.toContainText("結果の表で何が動くはずかを考えて");
});

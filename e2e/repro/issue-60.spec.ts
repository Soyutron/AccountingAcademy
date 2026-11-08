import { expect, test } from "@playwright/test";

// Issue #60: 科目が合っていて金額だけ違う仕訳に、金額に触れない汎用文だけが出ていた
test("科目が合っていて金額だけ違う仕訳には、金額の違いを指す説明が出る", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/other-receivables-and-payables");
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("未収入金");
  await work.getByLabel("借方の金額 1").fill("5000");
  await work.getByLabel("貸方の科目 1").fill("備品");
  await work.getByLabel("貸方の金額 1").fill("5000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  await expect(status).not.toContainText("何が動くはず");
  await expect(status).toContainText("金額");
});

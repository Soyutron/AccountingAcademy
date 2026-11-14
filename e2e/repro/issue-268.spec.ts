import { expect, test } from "@playwright/test";

// Issue #268: 「車輌運搬具」(輌の表記)と入れると科目として読まれず記帳できない(定額法 ステップ2)
test("車輌運搬具の表記でも車両運搬具として記帳できる", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto("/units/depreciation/straight-line");
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("車輌運搬具");
  await work.getByLabel("借方の金額1").fill("1200000");
  await work.getByLabel("貸方の科目1").fill("現金");
  await work.getByLabel("貸方の金額1").fill("1200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
});

// 同じIssueのコメント: 「給与」が給料の別名に無く記帳できない(立替金・預り金 ステップ2)
test("「給与」でも給料として記帳できる", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const fill = async (label: string, value: string) => work.getByLabel(label, { exact: true }).fill(value);
  await page.goto("/units/receivables-and-payables/temporary-and-deposits");
  await page.getByRole("button", { name: "次へ →" }).click();
  await fill("借方の科目1", "給与");
  await fill("借方の金額1", "100000");
  await fill("貸方の科目1", "普通預金");
  await fill("貸方の金額1", "97000");
  await work.getByRole("button", { name: "行を追加" }).nth(1).click();
  await fill("貸方の科目2", "預り金");
  await fill("貸方の金額2", "3000");
  await work.getByRole("button", { name: "記帳する", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
});

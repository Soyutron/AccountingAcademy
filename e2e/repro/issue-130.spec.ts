import { expect, test, type Page } from "@playwright/test";

const unit = "/units/receivables-and-payables/temporary-and-deposits";

async function field(page: Page, label: string, value: string) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel(label).fill(value);
  await work.getByLabel(label).press("Escape");
}

test("ステップ 2: 天引きを忘れた 給料 100,000 / 普通預金 100,000 に、汎用文でない説明を返す", async ({ page }) => {
  await page.goto(unit);
  await page.getByRole("button", { name: "次へ →" }).click();
  await field(page, "借方の科目 1", "給料");
  await field(page, "借方の金額 1", "100000");
  await field(page, "貸方の科目 1", "普通預金");
  await field(page, "貸方の金額 1", "100000");
  await page.getByRole("region", { name: "ワークスペース" }).getByRole("button", { name: "記帳する" }).click();
  const box = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(box).toBeVisible();
  await expect(box).toContainText("預かっている義務");
  await expect(box.filter({ hasText: "まだ合っていません" })).toHaveCount(0);
});

import { expect, test } from "@playwright/test";

// 備品は600,000 → 550,000 → 630,000と動き、630,000だった時点は無いので「戻り」とは書けない
test("商品以外の後払いと手付金 ステップ3: 成功文が備品の増加を「戻り」と言わない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  await page.goto("/units/receivables-and-payables/other-receivables-and-payables");
  await next.click();
  await work.getByLabel("借方の科目1").fill("未収入金");
  await work.getByLabel("借方の金額1").fill("50000");
  await work.getByLabel("貸方の科目1").fill("備品");
  await work.getByLabel("貸方の金額1").fill("50000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  const selects = work.locator("select");
  for (const [i, value] of ["increase", "increase", "none", "none", "none"].entries()) await selects.nth(i).selectOption(value);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(page.getByText(/630,000に戻り/)).toHaveCount(0);
});

import { expect, test } from "@playwright/test";

// Issue #29: 同じ科目を 2 行に分けた仕訳が、合計は正解と同じなのに「もう一歩」と汎用文になっていた
test("仕入を 2 行に分けて記帳すると正解になる", async ({ page }) => {
  await page.goto("/units/merchandise/credit-transactions");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 8")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("仕入");
  await work.getByLabel("借方の金額 1").fill("30000");
  await work.getByRole("button", { name: "行を追加" }).first().click();
  await work.getByLabel("借方の科目 2").fill("仕入");
  await work.getByLabel("借方の金額 2").fill("10000");
  await work.getByLabel("貸方の科目 1").fill("買掛金");
  await work.getByLabel("貸方の金額 1").fill("40000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const status = page.getByRole("status").filter({ hasText: /できました|もう一歩/ });
  await expect(status).toContainText("できました");
  await expect(status).toContainText("負債の箱に買掛金が現れました");
});

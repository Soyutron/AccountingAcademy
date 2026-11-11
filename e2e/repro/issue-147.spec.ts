import { expect, test } from "@playwright/test";

// Issue #147: スマホ幅でガイドの金額を押したら、ワークスペースへ切り替えて入った欄を見せる
test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

test("スマホ幅で問題文の金額を押すと、ワークスペースへ切り替わり入った金額欄にフォーカスが移る", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/loans");
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).first().click();
  const guideTab = page.getByRole("tab", { name: "ガイド" });
  const workSelected = page.getByRole("tab", { name: "ワークスペース", selected: true });
  const amount = page.getByRole("button", { name: "100,000円を仕訳帳に入れる" });
  const debit = page.locator('[data-amount-field="debit-0"]');
  const credit = page.locator('[data-amount-field="credit-0"]');

  await amount.tap();
  await expect(workSelected).toBeVisible();
  await expect(debit).toBeVisible();
  await expect(debit).toHaveValue("100000");
  await expect(debit).toBeFocused();

  // ガイドへ戻ってもう一度押すと、次の空欄へ入る
  await guideTab.tap();
  await amount.tap();
  await expect(workSelected).toBeVisible();
  await expect(credit).toBeVisible();
  await expect(credit).toHaveValue("100000");
  await expect(credit).toBeFocused();
});

import { expect, test } from "@playwright/test";

// Issue #24: 概念と勘定科目で同じ ID の用語が用語集に 2 つ並び、単元のポップオーバーには例の無い勘定科目版が出ていた
test("用語集の ID が一意で、単元の用語ポップオーバーに概念の例が出る", async ({ page }) => {
  await page.goto("/glossary");
  for (const id of ["cash_over_and_short", "checking_account", "bank_overdraft", "petty_cash"]) {
    await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  }

  await page.goto("/units/cash-and-deposits/petty-cash");
  const guide = page.getByRole("region", { name: "ガイド" });
  await guide.getByRole("button", { name: "小口現金", exact: true }).first().click();
  const popover = page.getByRole("dialog", { name: "小口現金" });
  await popover.getByRole("button", { name: "もっと見る" }).click();
  await expect(popover.getByText(/^例: 週の初めに担当者へ/)).toBeVisible();
  const related = popover.getByText(/^関連:/);
  await expect(related).toBeVisible();
  await expect(related).not.toContainText("小口現金");
});

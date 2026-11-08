import { expect, test } from "@playwright/test";

// Issue #33: 3 ペイン表示(1024〜1280px)で仕訳帳の行の「×」が貸方の科目欄に重なり、貸方の「×」や金額欄がカードの外へはみ出していた
for (const width of [1024, 1280, 1920]) {
  test(`${width}px で仕訳帳の行の「×」と金額欄が行の中に収まり、貸方に重ならない`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/units/bookkeeping-basics/five-elements");
    await page.getByRole("button", { name: "次へ →" }).click();
    const work = page.getByRole("region", { name: "ワークスペース" });
    for (const line of ["debit-0", "credit-0"]) {
      const row = work.locator(`[data-journal-line="${line}"]`);
      const rowBox = (await row.boundingBox())!;
      const del = (await row.getByRole("button", { name: "行を削除" }).boundingBox())!;
      const amount = (await row.locator("[data-amount-field]").boundingBox())!;
      expect(del.x + del.width).toBeLessThanOrEqual(rowBox.x + rowBox.width + 1);
      expect(amount.x + amount.width).toBeLessThanOrEqual(rowBox.x + rowBox.width + 1);
    }
    // 借方の「×」の上に貸方の要素が重ならない(押すと貸方が反応していた)
    const debitDel = work.locator('[data-journal-line="debit-0"]').getByRole("button", { name: "行を削除" });
    await work.getByRole("button", { name: "行を追加" }).first().click();
    await debitDel.click();
    await expect(work.locator('[data-journal-line="debit-1"]')).toHaveCount(0);
    await expect(work.locator('[data-journal-line="credit-1"]')).toHaveCount(0);
  });
}

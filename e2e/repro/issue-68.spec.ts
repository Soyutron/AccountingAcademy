import { expect, test } from "@playwright/test";

// Issue #68: 新しい行はDOM上「行を追加」より前にあるので、フォーカスが移らないとTabでは届かなかった
for (const [side, nth] of [["貸方", 1], ["借方", 0]] as const) {
  test(`${side}の「行を追加」をEnterで押すと、新しい行の科目欄にフォーカスが移る`, async ({ page }) => {
    await page.goto("/units/receivables-and-payables/temporary-and-deposits");
    await page.getByRole("button", { name: "次へ →" }).click();
    await page.getByLabel(`${side}の金額1`).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "行を追加" }).nth(nth)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel(`${side}の科目2`)).toBeFocused();
  });
}

import { expect, test } from "@playwright/test";

// 対になる科目のうち、借入金と支払利息にだけ関連の概念が無かった
// 見出しの「支払利息」に部分一致しないよう、リンクの完全一致で確かめる
test("借入金と支払利息の関連に、対応する概念のリンクが出る", async ({ page }) => {
  await page.goto("/glossary");
  await expect(page.locator("#loans_payable").getByRole("link", { name: "貸付金・借入金", exact: true })).toBeVisible();
  await expect(page.locator("#interest_expense").getByRole("link", { name: "利息", exact: true })).toBeVisible();
});

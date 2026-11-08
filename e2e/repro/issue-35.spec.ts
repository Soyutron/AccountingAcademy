import { expect, test } from "@playwright/test";

// Issue #35: 単元内の用語ポップオーバーの「関連:」が文字だけで、用語集のように関連用語を開けなかった
test("用語ポップオーバーの関連用語から、その用語の説明を開ける", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const guide = page.getByRole("region", { name: "ガイド" });
  await page.getByRole("button", { name: "次へ →" }).click();
  await guide.getByRole("button", { name: "仕訳", exact: true }).first().click();
  const popover = page.getByRole("dialog", { name: "仕訳" });
  await popover.getByRole("button", { name: "もっと見る" }).click();
  const related = popover.getByRole("link", { name: "借方と貸方", exact: true });
  await expect(related).toHaveAttribute("href", "/glossary#debit_credit");
  await related.click();
  await expect(page).toHaveURL(/\/glossary#debit_credit$/);
});

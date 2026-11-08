import { expect, test } from "@playwright/test";

// Issue #84: 「次へ →」「← 前へ」でステップが変わってもフォーカスがボタンに残り、次の Tab がページ先頭へ戻っていた
test("「次へ →」「← 前へ」を Enter で押すと、新しいステップの見出しへフォーカスが移る", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const heading = page.getByRole("region", { name: "ガイド" }).getByRole("heading", { level: 2 });
  const next = page.getByRole("button", { name: "次へ →" });
  const firstTitle = await heading.textContent();

  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await expect(next).not.toBeFocused();
  await expect(heading).toBeFocused();

  // 見出しから先へ Tab で進めば、ヘッダーを通らずに課題の入力欄へ届く
  const input = page.getByLabel("借方の科目 1");
  for (let i = 0; i < 20 && !(await input.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest("#pane-guide, #pane-work")))).toBe(true);
  }
  await expect(input).toBeFocused();

  await page.getByRole("button", { name: "← 前へ" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("ステップ 1 / 10")).toBeVisible();
  await expect(heading).toHaveText(firstTitle ?? "");
  await expect(heading).toBeFocused();
});

// ツアーの案内中は続きの操作が吹き出しにあるので、見出しではなく吹き出しへ移す
test("ツアー中に「次へ →」を Enter で押しても、フォーカスは見出しではなく吹き出しへ移る", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await tour.getByRole("button", { name: "はじめる" }).click();
  await tour.getByRole("button", { name: "次へ" }).click();
  await expect(tour).toContainText("3 / 12");

  await page.getByRole("button", { name: "次へ →" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/ステップ 2 \/ \d+/)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.activeElement?.closest("[aria-label='チュートリアル']"))))
    .toBe(true);
});

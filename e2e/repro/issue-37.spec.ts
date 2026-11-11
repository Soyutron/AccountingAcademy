import { expect, test, type Page } from "@playwright/test";

// Issue #37: ホバーで開いた用語をクリックすると閉じ、クリック直後のEscではホバーのタイマーで開き直っていた

const popover = (page: Page) => page.locator("[data-slot=popover-content]");
const firstTerm = (page: Page) =>
  page.getByRole("region", { name: "ガイド" }).locator("[data-slot=popover-trigger]").first();

test("用語にホバーしてからクリックしても、ポップオーバーは開いたままで中身にフォーカスが移る", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const term = firstTerm(page);
  await term.hover();
  await page.waitForTimeout(400);
  await expect(popover(page)).toHaveCount(1);
  await term.click();
  await page.waitForTimeout(400);
  await expect(popover(page)).toHaveCount(1);
  await expect(page.getByRole("button", { name: "もっと見る" })).toBeFocused();
});

test("クリックで開いた直後にEscを押すと閉じる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await firstTerm(page).click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  await expect(popover(page)).toHaveCount(0);
});

test("キーボードだけ(Enter → 即Esc)でも閉じる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await firstTerm(page).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  await expect(popover(page)).toHaveCount(0);
});

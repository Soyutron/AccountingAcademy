import { expect, test, type Locator, type Page } from "@playwright/test";

// Issue #208: ツアーの操作待ちの段で、カードから案内先の入力欄まで背後の画面全体を Tab で抜けないと届かなかった

const tourOf = (page: Page) => page.getByRole("dialog", { name: "チュートリアル" });
const nextOf = (page: Page) => tourOf(page).getByRole("button", { name: "次へ", exact: true });

// カードから Tab だけで target へ届くまでの回数を数える
async function tabsFromCard(page: Page, target: Locator) {
  await tourOf(page).locator("[data-tour-card]").focus();
  let tabs = 0;
  for (; tabs < 40; tabs++) {
    if (await target.evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  return tabs;
}

async function advanceToDebit(page: Page) {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const tour = tourOf(page);
  await tour.getByRole("button", { name: "はじめる" }).press("Enter");
  await expect(tour.getByText("2 / 12")).toBeVisible();
  await nextOf(page).press("Enter");
  await expect(tour.getByText("3 / 12")).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).first().press("Enter");
  await expect(tour.getByText("4 / 12")).toBeVisible();
}

test("4/12・5/12・7/12 のカードから、案内先へ少ない Tab で届く", async ({ page }) => {
  await advanceToDebit(page);
  const tour = tourOf(page);

  expect(await tabsFromCard(page, page.getByLabel("借方の科目 1"))).toBeLessThanOrEqual(5);
  await page.keyboard.type("現金");
  await page.getByLabel("借方の金額 1").fill("100000");
  await nextOf(page).click();
  await expect(tour.getByText("5 / 12")).toBeVisible();

  expect(await tabsFromCard(page, page.getByLabel("貸方の科目 1"))).toBeLessThanOrEqual(5);
  await page.keyboard.type("資本金");
  await page.getByLabel("貸方の金額 1").fill("100000");
  await nextOf(page).click();
  await expect(tour.getByText("6 / 12")).toBeVisible();
  await nextOf(page).click();
  await expect(tour.getByText("7 / 12")).toBeVisible();

  expect(await tabsFromCard(page, page.getByRole("button", { name: "記帳する" }))).toBeLessThanOrEqual(5);
  await page.keyboard.press("Enter");
  await expect(tour.getByText("8 / 12")).toBeVisible();
});

test("操作を終えた段では、Tab は案内先へ飛ばずカードの「次へ」に止まる", async ({ page }) => {
  await advanceToDebit(page);
  await page.getByLabel("借方の科目 1").fill("現金");
  await page.getByLabel("借方の金額 1").fill("100000");
  await expect(nextOf(page)).toBeEnabled();

  await tourOf(page).locator("[data-tour-card]").focus();
  await page.keyboard.press("Tab");
  await expect(tourOf(page).getByRole("button", { name: "スキップ" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(nextOf(page)).toBeFocused();
});

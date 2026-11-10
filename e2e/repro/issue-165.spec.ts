import { expect, test, type Page } from "@playwright/test";

// Issue #165: 「今はしない」やスキップの後は status が pending に戻らず、「使い方」のチェックを付け直しても案内が出なかった

const firstUnit = "/units/bookkeeping-basics/five-elements";
const otherUnit = "/units/merchandise/three-account-method";
const bannerOf = (page: Page) => page.getByRole("note").filter({ hasText: "初めてですか" });
const settingOf = (page: Page) => page.getByRole("checkbox", { name: "初めて単元を開いたときにチュートリアルを案内する" });

async function declineFromBanner(page: Page) {
  await page.goto(firstUnit);
  await expect(bannerOf(page)).toBeVisible();
  await bannerOf(page).getByRole("button", { name: "今はしない" }).click();
  await expect(bannerOf(page)).toHaveCount(0);
}

async function openHelp(page: Page) {
  await page.getByRole("button", { name: "使い方" }).first().click();
  await expect(settingOf(page)).toBeVisible();
}

// バナーはサーバー描画では出ないので、水和を待ってから「出ていない」を確かめる
async function expectNoBannerAfterHydration(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("region", { name: "ガイド" })).toBeVisible();
  await expect(bannerOf(page)).toHaveCount(0);
}

test("「今はしない」を押すと「使い方」のチェックが外れ、付け直せば未着手の単元で案内が戻る", async ({ page }) => {
  await declineFromBanner(page);

  await openHelp(page);
  await expect(settingOf(page)).not.toBeChecked();
  await settingOf(page).check();
  await page.keyboard.press("Escape");

  await page.goto(otherUnit);
  await expect(page.getByRole("region", { name: "ガイド" })).toBeVisible();
  await expect(bannerOf(page)).toBeVisible();
});

test("付け直して戻った案内の「はじめる」でツアーが始まり、スキップ後の reload では始まり直さない", async ({ page }) => {
  await declineFromBanner(page);
  await openHelp(page);
  await settingOf(page).check();
  await page.keyboard.press("Escape");

  await page.goto(otherUnit);
  await bannerOf(page).getByRole("link", { name: "はじめる" }).click();
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await expect(tour).toBeVisible();
  await tour.getByRole("button", { name: "スキップ" }).click();
  await expect(tour).toHaveCount(0);

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("region", { name: "ガイド" })).toBeVisible();
  await expect(tour).toHaveCount(0);
});

test("「今はしない」の後、チェックを外したままなら未着手の単元で案内は出ない", async ({ page }) => {
  await declineFromBanner(page);
  await expectNoBannerAfterHydration(page, otherUnit);
});

test("ツアーをスキップするとチェックが外れ、付け直せば未着手の単元で案内が戻る", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await tour.getByRole("button", { name: "スキップ" }).click();
  await expect(tour).toHaveCount(0);

  await openHelp(page);
  await expect(settingOf(page)).not.toBeChecked();
  await settingOf(page).check();
  await page.keyboard.press("Escape");

  await page.goto(otherUnit);
  await expect(bannerOf(page)).toBeVisible();
});

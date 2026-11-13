import { expect, test } from "@playwright/test";

// Issue #176: 全ページのタブ名が「Open簿記」のままで、複数タブの単元を見分けられなかった

test("単元ページのタブ名は単元名から始まる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await expect(page).toHaveTitle(/^5つの要素と仕訳/);
  await page.goto("/units/depreciation/straight-line");
  await expect(page).toHaveTitle(/^定額法/);
});

test("テーマ・学習パス・用語集のタブ名にページの名前が入り、トップと存在しないページはサービス名のまま", async ({ page }) => {
  await page.goto("/topics/depreciation");
  await expect(page).toHaveTitle("減価償却 | Open簿記");
  await page.goto("/paths/boki-3");
  await expect(page).toHaveTitle("簿記3級合格パス | Open簿記");
  await page.goto("/glossary");
  await expect(page).toHaveTitle("用語集 | Open簿記");
  await page.goto("/");
  await expect(page).toHaveTitle("Open簿記");
  await page.goto("/units/nope/nope");
  await expect(page).toHaveTitle("Open簿記");
});

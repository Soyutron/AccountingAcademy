import { expect, test } from "@playwright/test";

// Issue #110: 用語集の検索は空白の有無と全角・半角の違いで結果が変わらない

test("用語集で「5要素」(空白なし)と全角の「５要素」でも「5 要素」が見つかる", async ({ page }) => {
  await page.goto("/glossary");
  const search = page.getByLabel("用語を検索");

  for (const query of ["5 要素", "5要素", "５要素", "５ 要素", "5　要素"]) {
    await search.fill(query);
    await expect(page.locator("dl > div dt", { hasText: "5 要素" })).toHaveCount(1);
  }
});

test("空白なしの「5要素」は「一致する用語」に先に並ぶ", async ({ page }) => {
  await page.goto("/glossary");
  await page.getByLabel("用語を検索").fill("5要素");
  await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText("一致する用語");
  await expect(page.locator("dl").first().locator("dt", { hasText: "5 要素" })).toBeVisible();
});

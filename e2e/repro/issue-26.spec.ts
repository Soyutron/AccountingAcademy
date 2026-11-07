import { expect, test } from "@playwright/test";

// Issue #26: 用語集を勘定科目の別名(aliases)でも検索できる。正式名での検索は従来どおり

test("用語集を勘定科目の別名で検索できる", async ({ page }) => {
  await page.goto("/glossary");
  const search = page.getByLabel("用語を検索");
  const entry = page.locator('[id="accumulated_depreciation"]');

  await search.fill("建物減価償却累計額");
  await expect(entry).toBeVisible();
  await expect(entry).toContainText("別名: 建物減価償却累計額");
  await expect(page.getByText("該当する用語がありません。")).toHaveCount(0);

  await search.fill("減価償却累計額");
  await expect(entry).toBeVisible();
});

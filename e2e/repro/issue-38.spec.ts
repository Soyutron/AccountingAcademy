import { expect, test } from "@playwright/test";

// 検索で絞り込んだ状態で「関連」の用語を押すと、URL の # が変わるだけで何も表示されない
test("用語集で絞り込み中に関連の用語を押すと、その用語が表示される", async ({ page }) => {
  await page.goto("/glossary");
  const search = page.getByLabel("用語を検索");
  await search.fill("定額法");
  const item = page.locator("#straight_line_method");
  await item.getByRole("link", { name: "減価償却", exact: true }).click();
  await expect(page).toHaveURL(/#depreciation$/);
  await expect(page.locator("#depreciation")).toBeInViewport();
  await expect(search).toHaveValue("");
});

import { expect, test } from "@playwright/test";

// Issue #235: 絞り込み中に「関連」を押すと、検索結果の履歴が関連先で上書きされて「戻る」で用語集から出てしまう
test("絞り込み中に関連リンクを押した後のブラウザの戻るで、検索結果に戻る", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "用語集" }).click();
  await expect(page).toHaveURL(/\/glossary$/);
  const search = page.getByLabel("用語を検索");
  const items = page.locator("main dl > div[id]");
  await search.fill("売掛金");
  await expect(page).toHaveURL(/q=/);
  const narrowed = await items.count();

  await page.locator("main dl > div[id] a[href^='#']").first().click();
  await expect(page).toHaveURL(/#credit_transaction$/);
  await expect(search).toHaveValue("");
  await expect(page.locator("#credit_transaction")).toBeInViewport();

  await page.goBack();
  await expect(page).toHaveURL(/\/glossary\?q=/);
  await expect(search).toHaveValue("売掛金");
  await expect(items).toHaveCount(narrowed);
});

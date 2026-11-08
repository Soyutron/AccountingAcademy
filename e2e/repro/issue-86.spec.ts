import { expect, test } from "@playwright/test";

// Issue #86: 用語集の検索で、名前が検索語と完全に一致する項目を分野の順より前に出す

test("用語集の検索で、名前が検索語と一致する項目が先頭に出る", async ({ page }) => {
  await page.goto("/glossary");
  await page.getByPlaceholder("用語を検索").fill("現金");
  await expect(page.locator("#cash")).toBeVisible();
  await expect(page.locator("main div[id]").first()).toHaveAttribute("id", "cash");
  // 一致しなかった項目は従来どおり分野のグループに残り、同じ項目は二重に出ない
  await expect(page.locator('main div[id="accounts_receivable"]')).toHaveCount(1);
  await expect(page.locator('main div[id="cash"]')).toHaveCount(1);
});

test("用語集の検索で、別名が検索語と一致する項目も先頭に出る", async ({ page }) => {
  await page.goto("/glossary");
  await page.getByPlaceholder("用語を検索").fill("預金");
  await expect(page.locator("main div[id]").first()).toHaveAttribute("id", "bank_deposit");
});

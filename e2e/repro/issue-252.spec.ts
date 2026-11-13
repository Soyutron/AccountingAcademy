import { expect, test } from "@playwright/test";

// Issue #252: 利息の式で使う「元本」「年利率」が用語集で引けなかった(貸したお金、借りたお金)

const cases = [
  { query: "元本", name: "元本" },
  { query: "年利率", name: "年利率" },
  { query: "年利", name: "年利率" },
  { query: "利率", name: "年利率" },
];

for (const { query, name } of cases) {
  test(`用語集で「${query}」を検索すると「${name}」が先頭に出る`, async ({ page }) => {
    await page.goto("/glossary");
    await page.getByLabel("用語を検索").fill(query);
    await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText("一致する用語");
    await expect(page.locator("dl").first().locator("dt", { hasText: name }).first()).toBeVisible();
  });
}

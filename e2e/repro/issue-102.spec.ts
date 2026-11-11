import { expect, test } from "@playwright/test";

// Issue #102: 用語集をひらがな・カタカナの読みで検索できる。見つからないときは次の操作を案内する

test("用語集を読みで検索すると該当の用語が出る", async ({ page }) => {
  await page.goto("/glossary");
  const search = page.getByLabel("用語を検索");
  const empty = page.getByText("該当する用語がありません。");

  for (const [query, id] of [
    ["げんきん", "cash"],
    ["シワケ", "journal_entry"],
    ["かいかけきん", "accounts_payable"],
    ["げんか", "cost_of_goods_sold"],
  ]) {
    await search.fill(query);
    await expect(page.locator(`[id="${id}"]`)).toBeVisible();
    await expect(empty).toHaveCount(0);
  }
});

test("読みが完全に一致する用語は「一致する用語」に先に並ぶ", async ({ page }) => {
  await page.goto("/glossary");
  await page.getByLabel("用語を検索").fill("げんきん");
  await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText("一致する用語");
  await expect(page.locator("dl").first().locator('[id="cash"]')).toBeVisible();
});

test("0件のときは次に試すことを案内する", async ({ page }) => {
  await page.goto("/glossary");
  await page.getByLabel("用語を検索").fill("ぬぬぬ");
  await expect(page.getByText("該当する用語がありません。")).toBeVisible();
  await expect(page.getByText("漢字の一部")).toBeVisible();
});

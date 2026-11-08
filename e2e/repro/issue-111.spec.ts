import { expect, test } from "@playwright/test";

// Issue #111: 用語集の検索語を URL に持たせ、単元から戻っても絞り込みが残るようにする

test("用語集で検索して単元へ行き、戻ると検索語と絞り込みが残っている", async ({ page }) => {
  await page.goto("/glossary");
  const search = page.getByLabel("用語を検索");
  const items = page.locator("dl > div");
  const total = await items.count();
  await search.fill("減価");
  await expect(page).toHaveURL(/\/glossary\?q=/);
  const narrowed = await items.count();
  expect(narrowed).toBeLessThan(total);

  await page.locator("dl > div a", { hasText: "詳しく" }).first().click();
  await page.waitForURL(/units/);
  await page.goBack();

  await expect(search).toHaveValue("減価");
  await expect(items).toHaveCount(narrowed);
});

test("/glossary?q=減価 を直接開くと検索欄と一覧が絞られている", async ({ page }) => {
  await page.goto("/glossary");
  const total = await page.locator("dl > div").count();

  await page.goto(`/glossary?q=${encodeURIComponent("減価")}`);
  await expect(page.getByLabel("用語を検索")).toHaveValue("減価");
  await expect.poll(() => page.locator("dl > div").count()).toBeLessThan(total);
});

test("続けて打鍵しても入力が巻き戻らず、URL も最後の検索語になる", async ({ page }) => {
  await page.goto("/glossary");
  const search = page.getByLabel("用語を検索");
  await search.pressSequentially("減価償却費");
  await expect(search).toHaveValue("減価償却費");
  await expect(page).toHaveURL(`/glossary?q=${encodeURIComponent("減価償却費")}`);
});

test("検索語を消すと URL のクエリも消える", async ({ page }) => {
  await page.goto(`/glossary?q=${encodeURIComponent("減価")}`);
  const search = page.getByLabel("用語を検索");
  await expect(search).toHaveValue("減価");
  await search.fill("");
  await expect(page).toHaveURL(/\/glossary$/);
});

test("絞り込み中に「関連」を押すと検索が解けて、URL は関連先のアンカーだけになる", async ({ page }) => {
  await page.goto(`/glossary?q=${encodeURIComponent("減価")}`);
  const search = page.getByLabel("用語を検索");
  await expect(search).toHaveValue("減価");

  const related = page.locator('dl > div a[href^="#"]').first();
  const href = await related.getAttribute("href");
  await related.click();

  await expect(search).toHaveValue("");
  await expect(page).toHaveURL(new RegExp(`/glossary${href}$`));
  await expect(page.locator(href!)).toBeInViewport();
});

test("絞り込み中にヘッダーの「用語集」を押すと、検索語が残らず全件に戻る", async ({ page }) => {
  await page.goto("/glossary");
  const items = page.locator("dl > div");
  const total = await items.count();
  const search = page.getByLabel("用語を検索");
  await search.fill("減価");
  await expect(page).toHaveURL(/\/glossary\?q=/);

  await page.getByRole("banner").getByRole("link", { name: "用語集" }).click();

  await expect(page).toHaveURL(/\/glossary$/);
  await expect(search).toHaveValue("");
  await expect(items).toHaveCount(total);
});

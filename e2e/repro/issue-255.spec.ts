import { expect, test, type Page } from "@playwright/test";

// Issue #255: 素の <a href="#…"> で積まれた履歴はhistory.stateがnullで、単元から戻ってもNext.jsが画面を更新しない

// ハイドレーション前にアンカーを押すと後続のLinkが通常のページ遷移になり、再現しない。アンカー移動の後もルーターへの通知を待つ
const waitForRouterState = (page: Page) => expect.poll(() => page.evaluate(() => Boolean(window.history.state?.__NA))).toBe(true);

const guide = (page: Page) => page.getByRole("region", { name: "ガイド" });

test("用語集の関連リンクの後に単元へ進んで戻ると、用語集が表示される", async ({ page }) => {
  await page.goto("/glossary");
  await waitForRouterState(page);
  await page.locator("#transaction a[href='#journal_entry']").click();
  await expect(page).toHaveURL(/#journal_entry$/);
  await waitForRouterState(page);

  await page.locator("#journal_entry a[href^='/units']").first().click();
  await expect(guide(page)).toBeVisible();
  await page.goBack();

  await expect(page).toHaveURL(/\/glossary#journal_entry$/);
  await expect(page.locator("#journal_entry")).toBeInViewport();
  await expect(guide(page)).toHaveCount(0);

  // アンカー移動が履歴を1件だけ積んでいること
  await page.goBack();
  await expect(page).toHaveURL(/\/glossary$/);
  await expect(page.locator("#transaction")).toBeVisible();
});

test("絞り込み中の関連リンクの後に単元へ進んで戻ると、用語集が表示される", async ({ page }) => {
  await page.goto("/glossary");
  await waitForRouterState(page);
  await page.getByLabel("用語を検索").fill("売掛金");
  await expect(page).toHaveURL(/q=/);
  await page.locator("main dl > div[id] a[href^='#']").first().click();
  await expect(page).toHaveURL(/#credit_transaction$/);
  await waitForRouterState(page);

  await page.locator("#credit_transaction a[href^='/units']").first().click();
  await expect(guide(page)).toBeVisible();
  await page.goBack();

  await expect(page).toHaveURL(/\/glossary#credit_transaction$/);
  await expect(page.locator("#credit_transaction")).toBeVisible();
  await expect(guide(page)).toHaveCount(0);
});

test("用語集のスキップリンクはフォーカスを本文へ移し、単元へ進んで戻ると用語集が表示される", async ({ page }) => {
  await page.goto("/glossary");
  await waitForRouterState(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/glossary#main$/);
  await waitForRouterState(page);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("用語を検索")).toBeFocused();

  await page.locator("#journal_entry a[href^='/units']").first().click();
  await expect(guide(page)).toBeVisible();
  await page.goBack();

  await expect(page).toHaveURL(/\/glossary#main$/);
  await expect(page.locator("#journal_entry")).toBeVisible();
  await expect(guide(page)).toHaveCount(0);
});

test("トップページのスキップリンクの後に用語集へ進んで戻ると、トップページが表示される", async ({ page }) => {
  await page.goto("/");
  await waitForRouterState(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#main$/);
  await waitForRouterState(page);

  await page.getByRole("banner").getByRole("link", { name: "用語集" }).click();
  await expect(page.getByLabel("用語を検索")).toBeVisible();
  await page.goBack();

  await expect(page).toHaveURL(/\/#main$/);
  await expect(page.getByLabel("用語を検索")).toHaveCount(0);
});

test("単元でスキップリンクを使っても、会計IDEは作り直されない", async ({ page }) => {
  await page.goto("/glossary");
  await page.locator("#journal_entry a[href^='/units']").first().click();
  await expect(guide(page)).toBeVisible();
  await waitForRouterState(page);
  await guide(page).evaluate((el) => el.setAttribute("data-issue-255", "kept"));

  await page.locator("a[href='#main']").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await waitForRouterState(page);

  await expect(guide(page)).toHaveAttribute("data-issue-255", "kept");
});

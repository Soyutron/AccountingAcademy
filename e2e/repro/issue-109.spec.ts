import { expect, test } from "@playwright/test";

// 入力中にマウスが用語の上を通っても、ホバーで開いたポップオーバーが閉じるときに入力欄のフォーカスを奪わない
test("金額の入力中に用語をマウスが通過しても、入力欄のフォーカスと打鍵が保たれる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  const amount = page.getByRole("region", { name: "ワークスペース" }).getByLabel("借方の金額 1");
  await amount.click();
  await page.keyboard.type("12");
  await page.getByRole("region", { name: "ガイド" }).locator("button.term").first().hover();
  await expect(page.locator("[role=dialog]")).toBeVisible();
  await amount.hover();
  await expect(page.locator("[role=dialog]")).toHaveCount(0);
  await expect(amount).toBeFocused();
  await page.keyboard.type("34");
  await expect(amount).toHaveValue(/1,?234/);
});

test("ホバーで開いた用語を Esc で閉じても、入力欄のフォーカスが保たれる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  const amount = page.getByRole("region", { name: "ワークスペース" }).getByLabel("借方の金額 1");
  await amount.click();
  await page.getByRole("region", { name: "ガイド" }).locator("button.term").first().hover();
  await expect(page.locator("[role=dialog]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[role=dialog]")).toHaveCount(0);
  await expect(amount).toBeFocused();
});

test("どこにもフォーカスが無いときは、ホバーで開いた用語を閉じてもトリガーへフォーカスを移さない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const term = page.getByRole("region", { name: "ガイド" }).locator("button.term").first();
  await term.hover();
  await expect(page.locator("[role=dialog]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[role=dialog]")).toHaveCount(0);
  // 閉じた後のフォーカス処理は非同期なので、移らないことは少し待ってから確かめる
  await page.waitForTimeout(100);
  await expect(term).not.toBeFocused();
});

test("キーボードで開いた用語を Esc で閉じると、トリガーへフォーカスが戻る", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  const term = page.getByRole("region", { name: "ガイド" }).locator("button.term").first();
  await term.focus();
  await page.keyboard.press("Enter");
  const dialog = page.locator("[role=dialog]");
  await expect(dialog.getByRole("button", { name: "もっと見る" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(term).toBeFocused();
});

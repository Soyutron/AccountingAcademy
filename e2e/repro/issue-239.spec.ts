import { test, expect, devices } from "@playwright/test";

const { defaultBrowserType: _omit, ...iPhone } = devices["iPhone 13"];

// Issue #239: 「使い方」を読み進めると、閉じる × が本文と一緒にスクロールして画面外へ出ていた
test.use(iPhone);

test("390pxの「使い方」を最下部まで読んでも × が画面内にあり、押して閉じられる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).tap({ timeout: 3000 }).catch(() => {});
  await page.getByRole("button", { name: "使い方", exact: true }).first().tap();
  const help = page.getByRole("dialog", { name: "会計IDEの使い方" });
  for (const name of ["ガイド", "ワークスペース", "結果", "課題の種類", "進め方"]) {
    await help.locator("summary", { hasText: name }).tap();
  }

  // スクロール容器を問わず最下部へ出す(ダイアログ要素のscrollTopを動かすだけだと、内側がスクロールする実装で何も起きない)
  const last = help.getByRole("checkbox");
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();

  const viewport = page.viewportSize()!;
  const close = help.getByRole("button", { name: "閉じる" });
  const box = (await close.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

  await close.tap();
  await expect(help).toBeHidden();
});

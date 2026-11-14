import { devices, expect, test, type Page } from "@playwright/test";

// Issue #270: 390pxで画面の端寄りの用語を開くと、ポップオーバーが画面の縁にぴったり付いて角と枠が切れた
test.describe("390pxタッチ", () => {
  const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];
  test.use(iPhone);

  async function margins(page: Page, name: string) {
    const dialog = page.getByRole("dialog", { name });
    await expect(dialog).toBeVisible();
    // 開いた直後はzoom-in-95の途中で縮んでいるので、アニメーションが終わってから測る
    await dialog.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
    const box = (await dialog.boundingBox())!;
    const width = page.viewportSize()!.width;
    return { left: box.x, right: width - (box.x + box.width) };
  }

  test("左端の用語のポップオーバーに左右の余白がある", async ({ page }) => {
    await page.goto("/units/receivables-and-payables/loans");
    await page.getByRole("button", { name: "今はしない" }).tap();
    await page.getByRole("region", { name: "ガイド" }).getByRole("button", { name: "貸付金・借入金" }).first().tap();
    const { left, right } = await margins(page, "貸付金・借入金");
    expect(left).toBeGreaterThanOrEqual(8);
    expect(right).toBeGreaterThanOrEqual(8);
  });

  test("右端の用語のポップオーバーに左右の余白がある", async ({ page }) => {
    await page.goto("/units/birth-of-double-entry/venture-profit-and-double-entry");
    await page.getByRole("button", { name: "今はしない" }).tap();
    await page.getByRole("region", { name: "ガイド" }).getByRole("button", { name: "覚え書き" }).first().tap();
    const { left, right } = await margins(page, "覚え書き");
    expect(left).toBeGreaterThanOrEqual(8);
    expect(right).toBeGreaterThanOrEqual(8);
  });
});

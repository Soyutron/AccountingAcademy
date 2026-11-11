import { test, expect, devices, type Page } from "@playwright/test";

const { defaultBrowserType: _omit, ...iPhone } = devices["iPhone 13"];

async function expandTerm(page: Page) {
  await page.goto("/units/receivables-and-payables/temporary-and-deposits");
  await page.getByRole("button", { name: "今はしない" }).tap({ timeout: 3000 }).catch(() => {});
  const term = page.getByRole("region", { name: "ガイド" }).locator("button[aria-haspopup]").last();
  await term.scrollIntoViewIfNeeded();
  await term.tap();
  const dialog = page.getByRole("dialog", { name: "立替金・預り金" });
  await dialog.getByRole("button", { name: "もっと見る" }).tap();
  await expect(dialog.getByRole("link", { name: "用語集で見る" })).toBeAttached();
  // 開閉のアニメーションとRadixの再配置が落ち着くのを待つ
  await page.waitForTimeout(400);
  return dialog;
}

// 用語の上下どちらにも展開後のカードの高さが無い画面
for (const viewport of [
  { width: 844, height: 390 },
  { width: 390, height: 664 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ ...iPhone, viewport });

    test("「もっと見る」を押しても先頭が画面内に残り、カードの中をスクロールして末尾まで読める", async ({ page }) => {
      const dialog = await expandTerm(page);

      const box = (await dialog.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

      // 展開直後はカードの先頭(用語名)から読める
      expect(await dialog.evaluate((e) => e.scrollTop)).toBe(0);
      const name = (await dialog.getByText("立替金・預り金").first().boundingBox())!;
      expect(name.y).toBeGreaterThanOrEqual(box.y);

      await dialog.evaluate((e) => {
        e.scrollTop = e.scrollHeight;
      });
      const link = (await dialog.getByRole("link", { name: "用語集で見る" }).boundingBox())!;
      expect(link.y + link.height).toBeLessThanOrEqual(box.y + box.height);
    });
  });
}

test.describe("390×844", () => {
  test.use({ ...iPhone, viewport: { width: 390, height: 844 } });

  test("高さが足りる画面では全文がスクロールなしで見える", async ({ page }) => {
    const dialog = await expandTerm(page);

    const box = (await dialog.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(844);
    expect(await dialog.evaluate((e) => e.scrollHeight <= e.clientHeight)).toBe(true);
  });
});

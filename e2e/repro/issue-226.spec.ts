import { expect, test, type Page } from "@playwright/test";

const UNIT = "/units/receivables-and-payables/temporary-and-deposits";

test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });

async function openTerm(page: Page) {
  await page.goto(UNIT);
  await page.getByRole("button", { name: "今はしない" }).tap({ timeout: 3000 }).catch(() => {});
  const term = page.getByRole("region", { name: "結果" }).getByRole("button", { name: "現金", exact: true }).first();
  await term.tap();
  const dialog = page.getByRole("dialog", { name: "現金" });
  await expect(dialog).toBeVisible();
  return { term, dialog };
}

for (const viewport of [
  { width: 768, height: 1024 },
  { width: 390, height: 664 },
]) {
  test(`結果ペインの用語を開いたまま ${viewport.width}px に狭まると、対象が隠れるのでカードを閉じる`, async ({ page }) => {
    const { dialog } = await openTerm(page);
    await page.setViewportSize(viewport);
    await expect(dialog).toHaveCount(0);
  });
}

test("1024px 以上のまま幅が変わるだけなら、カードは開いたまま用語に付いている", async ({ page }) => {
  const { term, dialog } = await openTerm(page);
  await page.setViewportSize({ width: 1280, height: 768 });
  // 幅の変化で用語が動くので、Radix が付け直した後の位置を見る
  await expect
    .poll(async () => {
      const [t, d] = [await term.boundingBox(), await dialog.boundingBox()];
      if (!t || !d) return Infinity;
      return Math.min(Math.abs(d.y - (t.y + t.height)), Math.abs(t.y - (d.y + d.height)));
    })
    .toBeLessThan(16);
  await expect(dialog).toBeVisible();
});

test("結果ペインの「?」を開いたまま狭まっても、対象が隠れるのでカードを閉じる", async ({ page }) => {
  await page.goto(UNIT);
  await page.getByRole("button", { name: "今はしない" }).tap({ timeout: 3000 }).catch(() => {});
  await page.getByRole("region", { name: "結果" }).getByRole("button", { name: "「会社のかたち」の説明" }).tap();
  const dialog = page.getByRole("dialog", { name: "会社のかたち" });
  await expect(dialog).toBeVisible();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(dialog).toHaveCount(0);
});

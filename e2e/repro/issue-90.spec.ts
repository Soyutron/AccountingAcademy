import { test, expect, type Page } from "@playwright/test";

const UNIT = "/units/bookkeeping-basics/five-elements";

async function expectNavLinksOnOneLine(page: Page) {
  for (const name of ["3 級合格パス", "用語集"]) {
    const link = page.getByRole("banner").getByRole("link", { name, exact: true });
    await expect(link).toBeVisible({ timeout: 15000 });
    const lines = await link.evaluate((e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size;
    });
    expect(lines).toBe(1);
  }
}

test.describe("390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("ナビの語が途中で折れず、ブランド名も省略されず、横スクロールも出ない", async ({ page }) => {
    await page.goto(UNIT);
    await expectNavLinksOnOneLine(page);

    const brand = page.getByRole("banner").getByRole("link", { name: "AccountingAcademy", exact: true });
    expect(await brand.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });
});

// nowrap にした分の不足は、ブランド名の省略で吸収する(ヘッダーがページ幅を押し広げない)
for (const width of [360, 320]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("ナビの語が途中で折れず、ヘッダーからはみ出さない", async ({ page }) => {
      await page.goto(UNIT);
      await expectNavLinksOnOneLine(page);

      const nav = page.getByRole("banner").getByRole("navigation");
      expect(await nav.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
    });
  });
}

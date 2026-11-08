import { test, expect } from "@playwright/test";

const unitPath = "/units/bookkeeping-basics/five-elements";

for (const width of [320, 340, 360, 390]) {
  test(`ステップの点が多い単元でも ${width}px で横スクロールが出ず、単元タイトルが読める`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto(unitPath);
    await expect(page.getByText("ステップ 1 / 10")).toBeVisible({ timeout: 15000 });

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

    const help = await page.getByRole("button", { name: "使い方" }).first().boundingBox();
    expect(help!.x + help!.width).toBeLessThanOrEqual(width);

    const title = page.locator("span.truncate", { hasText: "つの要素と仕訳" });
    const { client, scroll } = await title.evaluate((e) => ({ client: e.clientWidth, scroll: e.scrollWidth }));
    expect(client / scroll).toBeGreaterThan(0.5);
  });
}

test("幅に余裕があれば進捗の点を表示する", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(unitPath);
  await expect(page.getByRole("list", { name: "ステップの進み具合" })).toBeVisible({ timeout: 15000 });
});

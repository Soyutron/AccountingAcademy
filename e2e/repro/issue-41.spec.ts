import { devices, expect, test, type Locator } from "@playwright/test";

// 合計が7桁になっても、貸借対照表の「負債・純資産合計」が語の途中で2行に折れない

async function expectSingleLine(label: Locator) {
  await expect(label).toBeVisible();
  const box = (await label.boundingBox())!;
  const lineHeight = await label.evaluate((e) => parseFloat(getComputedStyle(e).lineHeight));
  expect(box.height).toBeLessThan(lineHeight * 1.5);
}

test.describe("390px", () => {
  const { defaultBrowserType: _browser, ...iphone } = devices["iPhone 13"];
  test.use(iphone);

  test("「負債・純資産合計」が1行に収まる", async ({ page }) => {
    await page.goto("/units/receivables-and-payables/loans");
    await page.getByRole("tab", { name: "結果" }).click();
    await expectSingleLine(page.getByRole("region", { name: "結果" }).getByText("負債・純資産合計", { exact: true }));
  });
});

test.describe("1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("3ペインでも「負債・純資産合計」が1行に収まる", async ({ page }) => {
    await page.goto("/units/receivables-and-payables/loans");
    await expectSingleLine(page.getByText("負債・純資産合計", { exact: true }));
  });
});

import { devices, expect, type Page, test } from "@playwright/test";

// 長いガイドを読み終えた位置では、ペインのタブが画面の上に隠れていた
const { defaultBrowserType: _, ...iPhone13 } = devices["iPhone 13"];
test.use(iPhone13);

async function expectTabsReachableAtBottom(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const tabs = page.getByRole("tablist", { name: "ペインの切り替え" });
  expect(await tabs.evaluate((e) => e.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await tabs.getByRole("tab", { name: "ワークスペース" }).tap();
  await expect(tabs.getByRole("tab", { name: "ワークスペース" })).toHaveAttribute("aria-selected", "true");
  // 切り替えた先のペインは、固定したタブ列の下に潜らず先頭から見える
  const tabsBottom = await tabs.evaluate((e) => e.getBoundingClientRect().bottom);
  const paneTop = await page.getByRole("region", { name: "ワークスペース" }).evaluate((e) => e.getBoundingClientRect().top);
  expect(paneTop).toBeGreaterThanOrEqual(tabsBottom - 1);
}

test("390px で長いガイドの最後まで読んでも、ペインのタブに届く", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/other-receivables-and-payables", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "今はしない" }).tap();
  await expectTabsReachableAtBottom(page);
});

test("390px で課題のあるステップのガイドを最後まで読んでも、ペインのタブに届く", async ({ page }) => {
  await page.goto("/units/merchandise/three-account-method", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "今はしない" }).tap();
  await page.getByRole("button", { name: "次へ →" }).first().tap();
  await expect(page.getByText("ステップ2 /")).toBeVisible();
  await expectTabsReachableAtBottom(page);
});

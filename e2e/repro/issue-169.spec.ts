import { devices, expect, type Page, test } from "@playwright/test";

const { defaultBrowserType: _, ...iPhone13 } = devices["iPhone 13"];
test.use(iPhone13);

async function openWorkspaceOfStep2(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await page.getByRole("tablist", { name: "ペインの切り替え" }).getByRole("tab", { name: "ワークスペース" }).click();
  return page.getByRole("region", { name: "ワークスペース" });
}

async function expectResultPaneFromTop(page: Page) {
  const tabs = page.getByRole("tablist", { name: "ペインの切り替え" });
  await expect(tabs.getByRole("tab", { name: "結果" })).toHaveAttribute("aria-selected", "true");
  const top = (loc: ReturnType<Page["getByRole"]>) => loc.evaluate((e) => e.getBoundingClientRect().top);
  await expect.poll(() => top(tabs)).toBeGreaterThanOrEqual(0);
  // スクロールが遅れて戻らないことも見る
  await page.waitForTimeout(500);
  expect(await top(tabs)).toBeGreaterThanOrEqual(0);
  expect(await top(page.getByRole("region", { name: "結果" }))).toBeGreaterThanOrEqual(0);
}

test("スマホで予想して記帳すると、切り替わった結果タブは先頭から見える(predict)", async ({ page }) => {
  const work = await openWorkspaceOfStep2(page, "/units/depreciation/what-is-depreciation");
  const answer = { 資産: "decrease", 負債: "none", 純資産: "decrease", 収益: "none", 費用: "increase" };
  for (const [label, value] of Object.entries(answer)) await work.getByLabel(`${label}の予想`, { exact: true }).selectOption(value);
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await expectResultPaneFromTop(page);
});

test("スマホで記帳すると、切り替わった結果タブは先頭から見える(post)", async ({ page }) => {
  const work = await openWorkspaceOfStep2(page, "/units/bookkeeping-basics/five-elements");
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する", exact: true }).click();
  await expectResultPaneFromTop(page);
});

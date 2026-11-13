import { devices, expect, test } from "@playwright/test";

// Issue #88: スマホ幅の総勘定元帳で、同じ科目の借方と貸方の両方に摘要が並ぶと、ページが約700pxに広がって貸方の列が画面外に出ていた
test.use({ ...devices["iPhone 13"] });

test("390pxの総勘定元帳でT勘定の借方と貸方が画面幅に収まる", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).click({ timeout: 15000 });
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.locator("#tab-work").click();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  // ここで現金の貸方にも摘要が入る
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.locator("#tab-work").click();
  for (const label of ["資産"]) await work.getByLabel(`${label}の予想`, { exact: true }).selectOption("none");
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  await page.locator("#tab-work").click();
  await work.getByRole("tab", { name: /総勘定元帳/ }).click();
  await expect(work.getByRole("tab", { name: /総勘定元帳/ })).toHaveAttribute("aria-selected", "true");

  // ページ幅が収まっていても列だけ切れる退行を拾うため、貸方の見出しの右端も見る
  const creditHeadings = work.getByText(/^貸方(.増える側.)?$/);
  await expect(creditHeadings.first()).toBeVisible();
  const rights = await creditHeadings.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().right));
  expect(Math.max(...rights)).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

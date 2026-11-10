import { devices, expect, test } from "@playwright/test";

// Issue #179: スマホ幅の仕訳帳と総勘定元帳で、摘要が「…」で切れたまま全文を読む手段が無かった
test.use({ ...devices["iPhone 13"] });

test("390px の仕訳帳と T 勘定で摘要の全文が読める", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto("/units/receivables-and-payables/loans");
  await page.getByRole("button", { name: "今はしない" }).click({ timeout: 15000 });
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.locator("#tab-work").click();
  await work.getByLabel("借方の科目 1").fill("貸付金");
  await work.getByLabel("借方の金額 1").fill("100000");
  await work.getByLabel("貸方の科目 1").fill("普通預金");
  await work.getByLabel("貸方の金額 1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  await page.locator("#tab-work").click();
  const memo = "知り合いの焼き菓子店に、普通預金から 100,000 円を振り込んで貸し付けた";
  const isClipped = (e: HTMLElement) => e.scrollWidth > e.clientWidth;
  // 同じ文がワークスペース上部の問題文にも出るので(Issue #149)、タブパネルの中に絞る
  const journalMemo = work.getByRole("tabpanel", { name: /仕訳帳/ }).getByText(memo);
  await expect(journalMemo).toBeVisible();
  expect(await journalMemo.evaluate(isClipped)).toBe(false);

  await work.getByRole("tab", { name: /総勘定元帳/ }).click();
  const ledgerMemos = work.getByRole("tabpanel", { name: /総勘定元帳/ }).getByText(memo);
  await expect(ledgerMemos.first()).toBeVisible();
  expect(await ledgerMemos.evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth).length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

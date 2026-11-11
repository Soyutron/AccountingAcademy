import { type Page, expect, test } from "@playwright/test";

// 減価償却の2単元で、相手科目を取り違えた誤答に汎用文だけが出ていた
const parts = (page: Page) => ({
  work: page.getByRole("region", { name: "ワークスペース" }),
  status: page.getByRole("status"),
  next: page.getByRole("button", { name: "次へ →" }),
});

async function post(page: Page, debit: string, credit: string, amount: string) {
  const { work } = parts(page);
  await work.getByLabel("借方の科目1").fill(debit);
  await work.getByLabel("借方の金額1").fill(amount);
  await work.getByLabel("貸方の科目1").fill(credit);
  await work.getByLabel("貸方の金額1").fill(amount);
  await work.getByRole("button", { name: "記帳する" }).click();
}

async function predictAnswer(page: Page) {
  const { work, status } = parts(page);
  for (const [label, value] of [["資産", "減る"], ["負債", "変わらない"], ["純資産", "減る"], ["収益", "変わらない"], ["費用", "増える"]]) {
    await work.getByLabel(`${label}の予想`, { exact: true }).selectOption({ label: value });
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(status.getByText("できました")).toBeVisible();
}

async function calc(page: Page, value: string) {
  const { work, status } = parts(page);
  await work.getByPlaceholder("金額(円)").fill(value);
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(status.getByText("できました")).toBeVisible();
}

async function expectSpecific(page: Page, word: string) {
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toContainText(word);
  await expect(status).not.toContainText("まだ合っていません");
}

test("減価償却とは何か ステップ5の自然な誤答に、汎用文でない説明を返す", async ({ page }) => {
  const { next } = parts(page);
  await page.goto("/units/depreciation/what-is-depreciation");
  await next.click();
  await predictAnswer(page);
  await next.click();
  await calc(page, "-260000");
  await next.click();
  await next.click();
  for (const [debit, credit, word] of [["減価償却費", "未払金", "未払金"], ["減価償却費", "買掛金", "買掛金"], ["消耗品費", "減価償却累計額", "消耗品費"]]) {
    await post(page, debit, credit, "100000");
    await expectSpecific(page, word);
  }
});

test("定額法 ステップ7の自然な誤答に、汎用文でない説明を返す", async ({ page }) => {
  const { next, work, status } = parts(page);
  await page.goto("/units/depreciation/straight-line");
  await next.click();
  await post(page, "車両運搬具", "現金", "1200000");
  await expect(status.getByText("できました")).toBeVisible();
  await next.click();
  await work.getByRole("slider").nth(2).fill("6");
  await expect(next).not.toHaveAttribute("aria-disabled", "true");
  await next.click();
  await work.getByRole("slider").nth(1).fill("300000");
  await expect(next).not.toHaveAttribute("aria-disabled", "true");
  await next.click();
  await calc(page, "100000");
  await next.click();
  await predictAnswer(page);
  await next.click();
  for (const [debit, credit, word] of [["備品", "減価償却累計額", "備品"], ["減価償却費", "車両運搬具", "車両運搬具"], ["減価償却費", "未払金", "未払金"], ["消耗品費", "減価償却累計額", "消耗品費"]]) {
    await post(page, debit, credit, "50000");
    await expectSpecific(page, word);
  }
});

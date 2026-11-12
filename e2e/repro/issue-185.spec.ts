import { type Page, expect, test } from "@playwright/test";

// Issue #185: バナーの「続きから」を押さずに手で正解してから押すと、「できました」なのにその仕訳が結果から消えていた
const UNIT = "/units/bookkeeping-basics/five-elements";

async function post(page: Page, debit: [string, string], credit: [string, string]) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill(debit[0]);
  await work.getByLabel("借方の金額1").fill(debit[1]);
  await work.getByLabel("貸方の科目1").fill(credit[0]);
  await work.getByLabel("貸方の金額1").fill(credit[1]);
  await work.getByRole("button", { name: "記帳する" }).click();
}

// 未正解のステップ2まで保存して再読み込みし、案内を残したまま手で解く
async function solveStep2WithoutResume(page: Page) {
  await page.goto(UNIT);
  await page.getByRole("button", { name: "今はしない" }).click();
  const next = page.getByRole("button", { name: "次へ →" });
  // 回答前の進捗は保存しない(Issue #214)ので、誤答してステップ2を保存する
  await next.click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/unit_progress") && r.request().method() === "POST"),
    post(page, ["現金", "1000000"], ["借入金", "1000000"]),
  ]);

  await page.reload();
  await expect(page.getByRole("button", { name: "続きから" })).toBeVisible();
  await next.click();
  await post(page, ["現金", "1000000"], ["資本金", "1000000"]);
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
}

function balanceSheet(page: Page) {
  return page.getByRole("region", { name: "結果" }).getByRole("region", { name: "貸借対照表" });
}

test("手で正解してから「続きから」を押しても、結果ペインに仕訳が残る", async ({ page }) => {
  await solveStep2WithoutResume(page);

  await page.getByRole("button", { name: "← 前へ" }).click();
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(balanceSheet(page)).toContainText("1,000,000");
});

test("手で解いて先へ進んでから「続きから」で戻っても、後の記帳の残高に仕訳が積まれる", async ({ page }) => {
  await solveStep2WithoutResume(page);
  const next = page.getByRole("button", { name: "次へ →" });
  const prev = page.getByRole("button", { name: "← 前へ" });
  await next.click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  for (const el of ["資産", "負債", "純資産", "収益", "費用"]) await work.getByLabel(`${el}の予想`, { exact: true }).selectOption("none");
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ4 / 10")).toBeVisible();
  await prev.click();
  await prev.click();
  await prev.click();
  await expect(page.getByText("ステップ1 / 10")).toBeVisible();

  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await next.click();
  await next.click();
  await expect(page.getByText("ステップ4 / 10")).toBeVisible();
  await post(page, ["現金", "300000"], ["借入金", "300000"]);
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  // 現金は1,000,000 - 600,000 + 300,000。手で解いた出資と備品の購入が欠けると300,000になる
  const sheet = balanceSheet(page);
  await expect(sheet.locator('[data-account="cash"]')).toContainText("700,000");
  await expect(sheet.locator('[data-account="equipment"]')).toContainText("600,000");
  await expect(sheet.locator('[data-account="capital_stock"]')).toContainText("1,000,000");
});

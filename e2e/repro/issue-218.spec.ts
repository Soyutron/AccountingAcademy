import { expect, test, type Page } from "@playwright/test";

const unit = "/units/receivables-and-payables/other-receivables-and-payables";
const GENERIC = /結果の表で何が動くはずか|計算の式と、使う数字/;

async function post(page: Page, debit: [string, number], credits: [string, number][]) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill(debit[0]);
  await work.getByLabel("借方の科目1").press("Escape");
  await work.getByLabel("借方の金額1").fill(String(debit[1]));
  for (const [i, [account, amount]] of credits.entries()) {
    if (i > 0 && (await work.getByLabel(`貸方の科目${i + 1}`).count()) === 0) await work.getByRole("button", { name: "行を追加" }).nth(1).click();
    await work.getByLabel(`貸方の科目${i + 1}`).fill(account);
    await work.getByLabel(`貸方の科目${i + 1}`).press("Escape");
    await work.getByLabel(`貸方の金額${i + 1}`).fill(String(amount));
  }
  await work.getByRole("button", { name: "記帳する" }).click();
}

const ok = (page: Page) => expect(page.getByText("できました", { exact: true })).toBeVisible();

async function predict(page: Page) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const selects = work.locator("select");
  for (const [i, value] of ["increase", "increase", "none", "none", "none"].entries()) await selects.nth(i).selectOption(value);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await ok(page);
}

/** ステップnの手前まで正解で進める */
async function goToStep(page: Page, n: number) {
  const next = page.getByRole("button", { name: "次へ →" });
  await page.goto(unit);
  await next.click();
  if (n === 2) return;
  await post(page, ["未収入金", 50000], [["備品", 50000]]);
  await ok(page);
  await next.click();
  await predict(page);
  await next.click();
  if (n === 4) return;
  await post(page, ["前払金", 10000], [["現金", 10000]]);
  await ok(page);
  await next.click();
  if (n === 5) return;
  await post(page, ["仕入", 40000], [["前払金", 10000], ["買掛金", 30000]]);
  await ok(page);
  await next.click();
  await predict(page);
  await next.click();
}

async function expectExplained(page: Page, reason: string) {
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  await expect(status.getByText(GENERIC)).toHaveCount(0);
  await expect(status).toContainText(reason);
}

test("ステップ2: 未収入金を未払金と取り違えると理由を返す", async ({ page }) => {
  await goToStep(page, 2);
  await post(page, ["未払金", 50000], [["備品", 50000]]);
  await expectExplained(page, "後で払う義務");
});

test("ステップ4: 前払金を未収入金と取り違えると理由を返す", async ({ page }) => {
  await goToStep(page, 4);
  await post(page, ["未収入金", 10000], [["現金", 10000]]);
  await expectExplained(page, "豆を受け取る権利");
});

test("ステップ5: 豆の残額を未払金にすると買掛金だと説明する", async ({ page }) => {
  await goToStep(page, 5);
  await post(page, ["仕入", 40000], [["前払金", 10000], ["未払金", 30000]]);
  await expectExplained(page, "買掛金");
});

test("ステップ7: 未収入金まで負債に足すと理由を返す", async ({ page }) => {
  await goToStep(page, 7);
  await page.getByPlaceholder("金額(円)").fill("365000");
  await page.getByRole("button", { name: "確認する" }).click();
  await expectExplained(page, "受け取る権利");
});

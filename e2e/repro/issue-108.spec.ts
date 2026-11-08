import { expect, test, type Page } from "@playwright/test";

const unit = "/units/receivables-and-payables/other-receivables-and-payables";
const GENERIC = "結果の表で何が動くはずか";

async function post(page: Page, debit: [string, number], credits: [string, number][]) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill(debit[0]);
  await work.getByLabel("借方の科目 1").press("Escape");
  await work.getByLabel("借方の金額 1").fill(String(debit[1]));
  for (const [i, [account, amount]] of credits.entries()) {
    if (i > 0) await work.getByRole("button", { name: "行を追加" }).nth(1).click();
    await work.getByLabel(`貸方の科目 ${i + 1}`).fill(account);
    await work.getByLabel(`貸方の科目 ${i + 1}`).press("Escape");
    await work.getByLabel(`貸方の金額 ${i + 1}`).fill(String(amount));
  }
  await work.getByRole("button", { name: "記帳する" }).click();
}

async function goToStep5(page: Page) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  await page.goto(unit);
  await next.click();
  await post(page, ["未収入金", 50000], [["備品", 50000]]);
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  const selects = work.locator("select");
  for (const [i, value] of ["increase", "increase", "none", "none", "none"].entries()) await selects.nth(i).selectOption(value);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await post(page, ["前払金", 10000], [["現金", 10000]]);
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ 5 / 9")).toBeVisible();
}

test("ステップ 5: 手付金を差し引かない 仕入 40,000 / 買掛金 40,000 に前払金を消す説明を返す", async ({ page }) => {
  await goToStep5(page);
  await post(page, ["仕入", 40000], [["買掛金", 40000]]);
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toContainText("前払金");
  await expect(status.getByText(GENERIC)).toHaveCount(0);
});

test("ステップ 5: 前受金で消す誤答に受け取った側の科目だと説明する", async ({ page }) => {
  await goToStep5(page);
  await post(page, ["仕入", 40000], [["前受金", 10000], ["買掛金", 30000]]);
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toContainText("受け取った側");
  await expect(status.getByText(GENERIC)).toHaveCount(0);
});

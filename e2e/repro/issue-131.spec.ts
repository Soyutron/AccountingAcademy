import { expect, type Page, test } from "@playwright/test";

// IMEの長音符や △ から始まる負数をcalcで読み、読めない書き方には負号の付け方を案内する(Issue #131)
async function openNegativeCalc(page: Page) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto("/units/depreciation/what-is-depreciation");
  await page.getByRole("button", { name: "次へ →" }).click();
  const answers: Record<string, string> = { 資産: "減る", 負債: "変わらない", 純資産: "減る", 収益: "変わらない", 費用: "増える" };
  for (const [el, label] of Object.entries(answers)) {
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption({ label });
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  return { calc: work.getByPlaceholder("金額(円)"), confirm: work.getByRole("button", { name: "確認する" }), work };
}

test("calcでIMEの長音符から始まる負数を読み、読めない書き方には負号の付け方を案内する", async ({ page }) => {
  const { calc, confirm, work } = await openNegativeCalc(page);
  await calc.fill("(260000)");
  await confirm.click();
  await expect(work.getByRole("status")).toHaveText(/先頭に - を付け/);

  await calc.fill("ー260000");
  await confirm.click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
});

test("calcで結果ペインと同じ △ の書き方でも正解になる", async ({ page }) => {
  const { calc, confirm } = await openNegativeCalc(page);
  await calc.fill("△260,000");
  await confirm.click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
});

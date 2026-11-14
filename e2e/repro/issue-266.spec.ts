import { expect, test, type Page } from "@playwright/test";

// Issue #266: 年利率2%を0.2と読んだ30,000円、符号違いの-3,000円に汎用文だけが出ていた(貸したお金、借りたお金 ステップ5)

const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const next = (page: Page) => page.getByRole("button", { name: "次へ →" }).click();
async function post(page: Page, debit: [string, string], credit: [string, string]) {
  const w = work(page);
  await w.getByLabel("借方の科目1").fill(debit[0]);
  await w.getByLabel("借方の金額1").fill(debit[1]);
  await w.getByLabel("貸方の科目1").fill(credit[0]);
  await w.getByLabel("貸方の金額1").fill(credit[1]);
  await w.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
}
async function predict(page: Page, answers: Record<string, string>) {
  for (const [el, label] of Object.entries(answers)) await work(page).getByLabel(`${el}の予想`, { exact: true }).selectOption({ label });
  await work(page).getByRole("button", { name: "予想して記帳する" }).click();
}
async function calc(page: Page, value: string) {
  await work(page).getByPlaceholder("金額(円)").fill(value);
  await work(page).getByRole("button", { name: "確認する" }).click();
}

for (const [value, phrase] of [
  ["30000", "0.02"],
  ["-3000", "符号"],
] as const) {
  test(`利息の計算で${value}と答えると、汎用文ではなく「${phrase}」を含む説明が出る`, async ({ page }) => {
    await page.goto("/units/receivables-and-payables/loans");
    await next(page);
    await post(page, ["貸付金", "100000"], ["普通預金", "100000"]);
    await next(page);
    await predict(page, { 資産: "増える", 負債: "変わらない", 純資産: "増える", 収益: "増える", 費用: "変わらない" });
    await next(page);
    await post(page, ["支払利息", "3000"], ["普通預金", "3000"]);
    await next(page);
    await calc(page, value);
    const status = page.getByRole("status").filter({ hasText: "もう一歩" });
    await expect(status).toBeVisible();
    await expect(status).not.toContainText("計算の式と、使う数字をもう一度確かめましょう");
    await expect(status).toContainText(phrase);
  });
}

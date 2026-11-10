import { expect, test, type Page } from "@playwright/test";

const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const next = (page: Page) => page.getByRole("button", { name: "次へ →" }).click();
async function post(page: Page, debit: [string, string], credit: [string, string]) {
  const w = work(page);
  await w.getByLabel("借方の科目 1").fill(debit[0]);
  await w.getByLabel("借方の金額 1").fill(debit[1]);
  await w.getByLabel("貸方の科目 1").fill(credit[0]);
  await w.getByLabel("貸方の金額 1").fill(credit[1]);
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

// Issue #181: 145000 は受け取った小切手を当座預金に足した誤答なので、受け取り側の誤解が付くこと
test("当座預金の計算で受け取った小切手を足すと、該当する誤解が付く", async ({ page }) => {
  await page.goto("/units/cash-and-deposits/checking-account");
  await next(page);
  await post(page, ["当座預金", "200000"], ["普通預金", "200000"]);
  await next(page);
  await predict(page, { 資産: "減る", 負債: "減る", 純資産: "変わらない", 収益: "変わらない", 費用: "変わらない" });
  await next(page);
  await post(page, ["仕入", "25000"], ["当座預金", "25000"]);
  await next(page);
  await post(page, ["現金", "30000"], ["売上", "30000"]);
  await next(page);
  await calc(page, "145000");
  await expect(page.getByText("よくある思い込み: 受け取った小切手は預金")).toBeVisible();
});

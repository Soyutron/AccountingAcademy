import { expect, test, type Page } from "@playwright/test";

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

// 学習中の単元を前提にする単元を、誤解の「解きほぐす単元」として案内しないこと
test("5つの要素の誤答から、この単元が前提の単元へ案内しない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await next(page);
  await post(page, ["現金", "1000000"], ["資本金", "1000000"]);
  await next(page);
  await predict(page, { 資産: "減る", 負債: "変わらない", 純資産: "減る", 収益: "変わらない", 費用: "増える" });
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();
  await expect(page.getByRole("link", { name: "解きほぐす単元: 減価償却とは何か" })).toHaveCount(0);
  await expect(page.getByText("あとの単元「減価償却とは何か」で詳しく学びます")).toBeVisible();
});

test("前提の単元へ戻る案内はリンクのまま出す", async ({ page }) => {
  await page.goto("/units/depreciation/what-is-depreciation");
  await next(page);
  await predict(page, { 資産: "減る", 負債: "増える", 純資産: "減る", 収益: "変わらない", 費用: "増える" });
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();
  await expect(page.getByRole("link", { name: "解きほぐす単元: 5つの要素と仕訳" })).toBeVisible();
});

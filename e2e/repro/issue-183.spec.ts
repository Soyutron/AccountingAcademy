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
  test.setTimeout(60_000);
  const w = work(page);
  const nextStep = () => page.getByRole("button", { name: "次へ →" }).click({ timeout: 15000 });
  const post = async (dr: string, cr: string, amount: string) => {
    await w.getByLabel("借方の科目1").fill(dr);
    await w.getByLabel("借方の金額1").fill(amount);
    await w.getByLabel("貸方の科目1").fill(cr);
    await w.getByLabel("貸方の金額1").fill(amount);
    await w.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByRole("status").getByText("できました", { exact: true })).toBeVisible();
    await nextStep();
  };
  await nextStep();
  await post("現金", "資本金", "1000000");
  await w.getByLabel("資産の予想", { exact: true }).selectOption({ label: "変わらない" });
  await w.getByRole("button", { name: "予想して記帳する" }).click();
  await nextStep();
  await post("現金", "借入金", "300000");
  await post("現金", "売上", "80000");
  await post("支払家賃", "現金", "50000");
  // ステップ7の仕分けで備品を費用に入れる(ステップ3は資産だけを問うので費用の誤答はここで起こす。Issue #170)
  const board = w.getByRole("group", { name: "仕分けボード" });
  const boxes: [string, string][] = [["現金", "資産"], ["備品", "費用"], ["借入金", "負債"], ["資本金", "純資産"], ["売上", "収益"], ["支払家賃", "費用"]];
  for (const [account, box] of boxes) {
    await board.getByRole("button", { name: account, exact: true }).click();
    await board.getByRole("button", { name: `${box} ← ここに入れる`, exact: true }).click();
  }
  await w.getByRole("button", { name: "確認する" }).click();
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

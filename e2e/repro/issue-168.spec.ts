import { expect, test, type Page } from "@playwright/test";

const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const next = (page: Page) => page.getByRole("button", { name: "次へ →" }).click();

async function post(page: Page, debit: string, credit: string, amount: number) {
  const w = work(page);
  await w.getByLabel("借方の科目1").fill(debit);
  await w.getByLabel("借方の金額1").fill(String(amount));
  await w.getByLabel("貸方の科目1").fill(credit);
  await w.getByLabel("貸方の金額1").fill(String(amount));
  await w.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status").getByText("できました", { exact: true })).toBeVisible();
}

test("「← 前へ」で戻ったステップの財務諸表は、そのステップの時点の残高になる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).click();
  await next(page);
  await post(page, "現金", "資本金", 1000000);
  await next(page);
  for (const label of ["資産の予想", "負債の予想", "純資産の予想", "収益の予想", "費用の予想"]) {
    await work(page).getByLabel(label, { exact: true }).selectOption({ label: "変わらない" });
  }
  await work(page).getByRole("button", { name: "予想して記帳する" }).click();
  await next(page);
  await post(page, "現金", "借入金", 300000);
  await next(page);
  await post(page, "現金", "売上", 80000);
  await next(page);
  await post(page, "支払家賃", "現金", 50000);

  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(page.getByText("ステップ5 / 10").first()).toBeVisible();

  const income = page.getByRole("region", { name: "損益計算書" });
  await expect(income).toContainText("売上");
  await expect(income).not.toContainText("支払家賃");
  await expect(page.getByRole("region", { name: "貸借対照表" })).toContainText("780,000");

  // スライダーと帳簿も同じ時点にそろう(「最新」が後の仕訳を含まない)
  const slider = page.getByRole("region", { name: "結果" }).getByRole("slider", { name: "帳簿をさかのぼる" });
  await expect(slider).toHaveAttribute("aria-valuetext", "最新");
  await expect(slider).toHaveAttribute("max", "4");
  const journal = work(page).getByRole("tabpanel");
  await expect(journal).toContainText("売上");
  await expect(journal).not.toContainText("支払家賃");
  await work(page).getByRole("tab", { name: "総勘定元帳(T勘定)" }).click();
  await expect(work(page).getByRole("tabpanel")).toContainText("売上");
  await expect(work(page).getByRole("tabpanel")).not.toContainText("支払家賃");

  // 「次へ →」で進み直すと、後の仕訳は失われず元の残高に戻る
  await next(page);
  await expect(page.getByText("ステップ6 / 10").first()).toBeVisible();
  await expect(income).toContainText("支払家賃");
  await expect(page.getByRole("region", { name: "貸借対照表" })).toContainText("730,000");
});

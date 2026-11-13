import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const units = JSON.parse(readFileSync(".velite/units.json", "utf8"));
const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const result = (page: Page) => page.getByRole("region", { name: "結果" });
const next = (page: Page) => page.getByRole("button", { name: "次へ →" }).click();

async function post(page: Page, debit: string, credit: string, amount: number) {
  await work(page).getByLabel("借方の科目1").fill(debit);
  await work(page).getByLabel("借方の金額1").fill(String(amount));
  await work(page).getByLabel("貸方の科目1").fill(credit);
  await work(page).getByLabel("貸方の金額1").fill(String(amount));
  await work(page).getByRole("button", { name: "記帳する", exact: true }).click();
}

// Issue #191: 金庫が多かったとき(現金過不足が貸方残)に、資産のマイナスとして見せない
test("現金過不足の貸方残が負債の部に「(仮)」で並び、資産の部に△が出ない", async ({ page }) => {
  const unit = units.find((u: { id: string }) => u.id === "cash-and-deposits/cash-over-and-short");
  await page.goto(`/units/${unit.id}`);
  await page.getByRole("button", { name: "今はしない" }).click();
  await next(page);
  await post(page, "現金過不足", "現金", 3000);
  await expect(page.getByRole("status").getByText("できました")).toBeVisible();
  await next(page);
  // ステップ3は費用と純資産だけを問い、資産の予想欄は出ない
  await expect(work(page).getByLabel("資産の予想", { exact: true })).toHaveCount(0);
  await work(page).getByLabel("費用の予想", { exact: true }).selectOption({ label: "増える" });
  await work(page).getByLabel("純資産の予想", { exact: true }).selectOption({ label: "減る" });
  await work(page).getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByRole("status").getByText("できました")).toBeVisible();
  await expect(page.getByText("現金過不足(資産)")).toHaveCount(0);
  await next(page);
  await work(page).getByPlaceholder("金額(円)").fill("1000");
  await work(page).getByRole("button", { name: "確認する" }).click();
  await next(page);
  await post(page, "雑損", "現金過不足", 1000);
  await next(page);
  await next(page);
  const board = work(page).getByRole("group", { name: "仕分けボード" });
  for (const [account, box] of [["現金", "資産"], ["普通預金", "資産"], ["通信費", "費用"], ["雑損", "費用"]]) {
    await board.getByRole("button", { name: new RegExp(`^${account}`) }).first().click();
    await board.getByRole("button", { name: new RegExp(`^${box}( ← ここに入れる)?$`) }).first().click();
  }
  await work(page).getByRole("button", { name: "確認する" }).click();
  await next(page);
  await page.getByRole("button", { name: "わかった" }).click();
  await post(page, "現金", "現金過不足", 2000);
  await expect(result(page).locator('[data-account="cash"]')).toContainText("299,000");
  await expect(result(page).locator('[data-element="asset"] [data-account="cash_over_and_short"]')).toHaveCount(0);
  const row = result(page).locator('[data-element="liability"] [data-account="cash_over_and_short"]');
  await expect(row).toContainText("現金過不足(仮)");
  await expect(row).toContainText("2,000");
  await expect(row).not.toContainText("△");
});

test("用語集の現金過不足に「仮勘定」のバッジが出る", async ({ page }) => {
  await page.goto("/glossary");
  const term = page.locator('[id="cash_over_and_short"] dt');
  await expect(term).toContainText("仮勘定");
  await expect(term).not.toContainText("資産");
});

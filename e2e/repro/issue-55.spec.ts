import { expect, test } from "@playwright/test";

// 増加の差分表示に、日本の会計でマイナスを表す ▲/△ を使わない
test("記帳で増えた行の差分に ▲ が付かない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  const bs = page.locator("[aria-label='貸借対照表']").first();
  await expect(bs).toContainText("増加");
  // 差分の記号は ▲/△(マイナスの慣行)以外にする
  expect(await bs.innerText()).not.toMatch(/[▲△]\s*(増加\s*)?[\d,]+/);
  await expect(bs.locator("[data-account='cash']")).toContainText("+");
});

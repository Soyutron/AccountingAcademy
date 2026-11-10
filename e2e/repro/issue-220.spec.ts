import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const read = (name: string) => JSON.parse(readFileSync(`.velite/${name}.json`, "utf8"));
const unit = read("units").find((u: { id: string }) => u.id === "receivables-and-payables/other-receivables-and-payables");

// Issue #220: 学習パスで減価償却より前にある単元に、未習の「帳簿価額」「固定資産売却損益」が定義なしで出ていた
test("減価償却の前の単元で帳簿価額を未定義のまま使わない", () => {
  const usesTerm = unit.steps[1].task.transaction.includes("帳簿価額");
  expect(usesTerm && !unit.introduces.includes("book_value")).toBe(false);
});

test("備品を売ったら売上の見方に未定義の語を出さない", () => {
  const mis = read("misconceptions").misconceptions.find((m: { id: string }) => m.id === "asset_sale_is_sales");
  expect(mis.correct).not.toMatch(/帳簿価額|固定資産売却損益/);
});

test("ステップ 2 の問題文と売上と書いたときの説明に未習の語が出ない", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/other-receivables-and-payables");
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await expect(page.getByRole("region", { name: "ガイド" })).toContainText("古いショーケース(備品)を 50,000 円で売却し");
  await expect(page.getByText(/帳簿価額/)).toHaveCount(0);
  await work.getByLabel("借方の科目 1").fill("未収入金");
  await work.getByLabel("借方の金額 1").fill("50000");
  await work.getByLabel("貸方の科目 1").fill("売上");
  await work.getByLabel("貸方の金額 1").fill("50000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toContainText("売上は商品を売ったときだけ");
  await expect(status).not.toContainText(/帳簿価額|固定資産売却損益/);
});

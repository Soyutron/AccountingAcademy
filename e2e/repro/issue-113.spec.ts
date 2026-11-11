import { expect, test } from "@playwright/test";

// Issue #113: predictでは「答えを見る」が出ないのに、「いまの画面でできること」が「2回間違えると」と案内していた
test("predictのステップの「使い方」に「2回間違えると答えを見る」が出ない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();

  await page.getByRole("button", { name: "使い方" }).first().click();
  const help = page.getByRole("dialog", { name: "会計IDEの使い方" });
  const now = help.getByRole("region", { name: "いまの画面でできること" });
  await expect(now.locator("dt").filter({ hasText: "ヒントと答え" })).toBeVisible();
  await expect(now).toContainText("「ヒントを見る」");
  await expect(now).not.toContainText("2回間違えると");
});

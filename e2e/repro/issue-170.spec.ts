import { expect, test } from "@playwright/test";

// Issue #170: ステップ3の予想は、本文で定義済みの資産だけを問う
test("ステップ3の予想は資産だけで記帳できる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  await expect(work.getByLabel("資産の予想", { exact: true })).toBeVisible();
  for (const el of ["負債", "純資産", "収益", "費用"]) await expect(work.getByLabel(`${el}の予想`, { exact: true })).toHaveCount(0);
  await work.getByLabel("資産の予想", { exact: true }).selectOption({ label: "変わらない" });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByRole("button", { name: "次へ →" })).toBeEnabled();
});

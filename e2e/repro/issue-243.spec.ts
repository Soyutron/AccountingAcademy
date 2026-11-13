import { expect, test } from "@playwright/test";

// Issue #243: 「売上はいつ記録するべきか」と問うのに、納品の日に売上にする理由が誤答文にしか無かった

test("正解で進めても、ステップ3の成功文で納品の日に売上にする理由が読める", async ({ page }) => {
  await page.goto("/units/merchandise/credit-transactions");
  await page.getByRole("button", { name: "今はしない" }).click({ timeout: 8000 }).catch(() => {});
  const work = page.getByRole("region", { name: "ワークスペース" });
  const guide = page.getByRole("region", { name: "ガイド" });

  await page.getByRole("button", { name: "次へ →" }).first().click();
  await expect(page.getByText("ステップ2 / 8")).toBeVisible();
  await work.getByLabel("借方の科目1").fill("仕入");
  await work.getByLabel("借方の金額1").fill("40000");
  await work.getByLabel("貸方の科目1").fill("買掛金");
  await work.getByLabel("貸方の金額1").fill("40000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).first().click();

  await expect(page.getByText("ステップ3 / 8")).toBeVisible();
  await expect(guide).toContainText("売上はいつ記録するべきでしょうか");
  await expect(guide).not.toContainText("左には何が増える");

  const answer = { 資産: "増える", 負債: "変わらない", 純資産: "増える", 収益: "増える", 費用: "変わらない" };
  for (const [k, v] of Object.entries(answer)) await work.getByLabel(`${k}の予想`, { exact: true }).selectOption({ label: v });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  const success = page.getByRole("status").filter({ hasText: "できました" });
  await expect(success).toContainText("義務");
  await expect(success).toContainText("権利");
});

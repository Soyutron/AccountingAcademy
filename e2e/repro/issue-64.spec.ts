import { test, expect } from "@playwright/test";

test("最初の単元のpredictで資産を外すと、資産の誤解に触れる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  const sel = (n: string, v: string) => page.getByLabel(`${n}の予想`, { exact: true }).selectOption({ label: v });
  await sel("資産", "減る");
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  const status = page.getByRole("status");
  await expect(status).toContainText("もう一歩");
  await expect(status).toContainText("資産として増えました");
  // ステップ3は資産だけを問うので(Issue #170)、誤解も資産の1件だけ
  await expect(status.getByText("よくある思い込み:")).toHaveCount(1);
});

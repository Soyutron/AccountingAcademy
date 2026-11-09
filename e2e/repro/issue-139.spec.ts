import { expect, test } from "@playwright/test";

// Issue #139: tweak は出力の値だけで達成になるのに、成功文が特定の条件(6 年 / 残存価額 300,000)を前提に書かれていた
test("定額法の tweak を想定と別の条件で達成しても、成功文が画面の条件と食い違わない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = page.getByRole("status").filter({ hasText: "できました" });

  await page.goto("/units/depreciation/straight-line");
  await next.click();
  await work.getByLabel("借方の科目 1").fill("車両運搬具");
  await work.getByLabel("借方の金額 1").fill("1200000");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await work.getByLabel("貸方の金額 1").fill("1200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(done).toBeVisible();
  await next.click();

  await expect(page.getByText("ステップ 3 / 9")).toBeVisible();
  await work.getByRole("slider", { name: /取得原価/ }).fill("600000");
  await work.getByRole("slider", { name: /耐用年数/ }).fill("3");
  await expect(done).toBeVisible();
  await expect(done).toContainText("1 年分が 200,000 円");
  await expect(done).not.toContainText("6 年");
  await next.click();

  await expect(page.getByText("ステップ 4 / 9")).toBeVisible();
  await work.getByRole("slider", { name: /耐用年数/ }).fill("8");
  await expect(done).toBeVisible();
  await expect(done).toContainText("1 年分が 150,000 円");
  await expect(done).not.toContainText("300,000");
  await expect(done).not.toContainText("6 年");
});

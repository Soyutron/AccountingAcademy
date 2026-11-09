import { expect, test } from "@playwright/test";

// Issue #164: 「年数を探して」と言うステップの図に、探す答え(6 年で毎年 200,000 円)が書いてあった
test("定額法 ステップ 3: 図はスライダーの初期状態を見せ、探す答えの 6 年を出さない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const guide = page.getByRole("region", { name: "ガイド" });
  const next = page.getByRole("button", { name: "次へ →" });

  await page.goto("/units/depreciation/straight-line");
  await next.click();
  await work.getByLabel("借方の科目 1").fill("車両運搬具");
  await work.getByLabel("借方の金額 1").fill("1200000");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await work.getByLabel("貸方の金額 1").fill("1200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();

  await expect(page.getByText("ステップ 3 / 9")).toBeVisible();
  await expect(guide).not.toContainText("6 年に分けると");
  await expect(guide).not.toContainText("6年目");
  await expect(guide).toContainText("4年目");
  await expect(guide).toContainText("耐用年数 4 年なら");
  // 月割りで 1 年目が 100,000 になる後のステップと矛盾しないよう、図の「1年目」の意味を書く
  await expect(guide).toContainText("使い始めてからの 1 年");
});

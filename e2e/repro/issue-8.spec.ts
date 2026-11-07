import { expect, test } from "@playwright/test";

// Issue #8: 定額法 ステップ 8 で、誤答 1,000,000 の説明が 1,100,000 用の文になっていて、success の年数も計算と合わなかった
test("定額法 ステップ 8: 誤答 1,000,000 の説明と success の年数が計算と一致する", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = page.getByText("できました", { exact: true });
  const post = async (d: string, c: string, amount: string) => {
    await work.getByLabel("借方の科目 1").fill(d);
    await work.getByLabel("借方の金額 1").fill(amount);
    await work.getByLabel("貸方の科目 1").fill(c);
    await work.getByLabel("貸方の金額 1").fill(amount);
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(done).toBeVisible();
  };
  await page.goto("/units/depreciation/straight-line");
  await next.click();
  await post("車両運搬具", "現金", "1200000");
  await next.click();
  await work.getByRole("slider", { name: "耐用年数" }).fill("6");
  await expect(done).toBeVisible();
  await next.click();
  await work.getByRole("slider", { name: "残存価額" }).fill("300000");
  await expect(done).toBeVisible();
  await next.click();
  await work.getByPlaceholder("金額(円)").fill("100000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(done).toBeVisible();
  await next.click();
  for (const [el, v] of [["資産", "decrease"], ["負債", "none"], ["純資産", "decrease"], ["収益", "none"], ["費用", "increase"]])
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(next).toHaveAttribute("aria-disabled", "false");
  await next.click();
  await post("減価償却費", "減価償却累計額", "50000");
  await next.click();
  await expect(page.getByText("ステップ 8 / 9")).toBeVisible();

  // 1,000,000 = 1,200,000 − 200,000。2 年目の分だけ引いて 1 年目を引き忘れた答え
  await work.getByPlaceholder("金額(円)").fill("1000000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(page.getByText("もう一歩")).toBeVisible();
  await expect(page.getByText("1 年目の 100,000 しか引いていません")).toHaveCount(0);
  await expect(page.getByText(/2 年目の 200,000 しか引いていません/)).toBeVisible();
  await expect(page.getByText(/1 年目の 100,000/)).toBeVisible();

  // 900,000 ÷ 200,000 = 4.5 年、取得からは 6 年(耐用年数どおり)
  await work.getByPlaceholder("金額(円)").fill("900000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(done).toBeVisible();
  await expect(page.getByText(/6 年と半年/)).toHaveCount(0);
  await expect(page.getByText(/4 年半/)).toBeVisible();
  await expect(page.getByText(/取得から 6 年/)).toBeVisible();
});

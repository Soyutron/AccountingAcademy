import { expect, test } from "@playwright/test";

// Issue #8: 定額法 ステップ8で、誤答1,000,000の説明が1,100,000用の文になっていて、successの年数も計算と合わなかった
test("定額法 ステップ8: 誤答1,000,000の説明とsuccessの年数が計算と一致する", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = page.getByText("できました", { exact: true });
  const post = async (d: string, c: string, amount: string) => {
    await work.getByLabel("借方の科目1").fill(d);
    await work.getByLabel("借方の金額1").fill(amount);
    await work.getByLabel("貸方の科目1").fill(c);
    await work.getByLabel("貸方の金額1").fill(amount);
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
  await expect(page.getByText("ステップ8 / 9")).toBeVisible();

  // 1,000,000 = 1,200,000 − 200,000。2年目の分だけ引いて1年目を引き忘れた答え
  await work.getByPlaceholder("金額(円)").fill("1000000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(page.getByText("もう一歩")).toBeVisible();
  await expect(page.getByText("1年目の100,000しか引いていません")).toHaveCount(0);
  await expect(page.getByText(/2年目の200,000しか引いていません/)).toBeVisible();
  await expect(page.getByText(/1年目の100,000/)).toBeVisible();

  // 900,000 ÷ 200,000 = 4.5年、取得からは6年(耐用年数どおり)
  await work.getByPlaceholder("金額(円)").fill("900000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(done).toBeVisible();
  await expect(page.getByText(/6年と半年/)).toHaveCount(0);
  await expect(page.getByText(/4年半/)).toBeVisible();
  await expect(page.getByText(/取得から6年/)).toBeVisible();
});

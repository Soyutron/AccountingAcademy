import { expect, test } from "@playwright/test";

// 成功文の「商品のもうけ」が次の calc の正解と同じ金額を指し、120,000 と 50,000 に専用の説明が付くこと
test("仕入と売上 ステップ 4・5: 商品のもうけの金額が食い違わない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const status = page.getByRole("status");
  const post = async (d: string, c: string, amount: string) => {
    await work.getByLabel("借方の科目 1").fill(d);
    await work.getByLabel("借方の金額 1").fill(amount);
    await work.getByLabel("貸方の科目 1").fill(c);
    await work.getByLabel("貸方の金額 1").fill(amount);
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
  };
  const answer = async (value: string) => {
    await work.getByPlaceholder("金額(円)").fill(value);
    await work.getByRole("button", { name: "確認する" }).click();
  };

  await page.goto("/units/merchandise/three-account-method");
  await next.click();
  await post("仕入", "現金", "30000");
  await next.click();
  for (const [label, value] of [["資産", "減る"], ["負債", "変わらない"], ["純資産", "減る"], ["収益", "変わらない"], ["費用", "増える"]]) {
    await work.getByLabel(`${label}の予想`, { exact: true }).locator("visible=true").selectOption({ label: value });
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await post("現金", "売上", "90000");
  await expect(status.filter({ hasText: "商品のもうけ" }).filter({ hasText: "今月の豆と菓子の売上 90,000" })).toBeVisible();
  await expect(status.filter({ hasText: "この差が商品のもうけ" }).filter({ hasText: "170,000" })).toHaveCount(0);

  await next.click();
  await expect(page.getByText("さきほど記帳した今月の売上 90,000")).toBeVisible();
  await expect(page.getByText("結果の表から、今月の売上 90,000")).toHaveCount(0);

  await answer("120000");
  await expect(status.filter({ hasText: "もう一歩" })).toBeVisible();
  await expect(status.filter({ hasText: "先月のコーヒー" })).toBeVisible();
  await expect(status.filter({ hasText: "計算の式と、使う数字" })).toHaveCount(0);

  await answer("50000");
  await expect(status.filter({ hasText: "それは仕入の合計" })).toBeVisible();
  await expect(status.filter({ hasText: "計算の式と、使う数字" })).toHaveCount(0);

  await answer("40000");
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
});

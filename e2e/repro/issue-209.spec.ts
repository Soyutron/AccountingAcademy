import { expect, test } from "@playwright/test";

// 合計が正しく扱えない金額は入力の時点で止め、受け付ける上限の金額なら貸借対照表の左右は一致する
test("自由に試すで上限を超える金額は記帳できず、上限の金額では左右が一致する", async ({ page }) => {
  await page.goto("/units/depreciation/straight-line");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const results = page.getByRole("region", { name: "結果" });
  const next = page.getByRole("button", { name: "次へ →" });
  const fill = async (debit: [string, string], credit: [string, string]) => {
    await work.getByLabel("借方の科目1").fill(debit[0]);
    await work.getByLabel("借方の金額1").fill(debit[1]);
    await work.getByLabel("貸方の科目1").fill(credit[0]);
    await work.getByLabel("貸方の金額1").fill(credit[1]);
  };
  const post = async (debit: [string, string], credit: [string, string]) => {
    await fill(debit, credit);
    await work.getByRole("button", { name: "記帳する" }).click();
  };
  const slide = async (i: number, steps: number) => {
    const s = page.getByRole("slider").nth(i);
    await s.focus();
    await page.keyboard.press("Home");
    for (let k = 0; k < steps; k++) await page.keyboard.press("ArrowRight");
  };
  await next.click();
  await post(["車両運搬具", "1200000"], ["現金", "1200000"]);
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await slide(2, 5); // 耐用年数6年
  await next.click();
  await slide(1, 6); // 残存価額300,000
  await next.click();
  await work.getByPlaceholder("金額(円)").fill("100000");
  await work.getByRole("button", { name: "確認する" }).click();
  await next.click();
  for (const [el, v] of [["資産", "decrease"], ["負債", "none"], ["純資産", "decrease"], ["収益", "none"], ["費用", "increase"]])
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await next.click();
  await post(["減価償却費", "50000"], ["減価償却累計額", "50000"]);
  await next.click();
  await work.getByPlaceholder("金額(円)").fill("900000");
  await work.getByRole("button", { name: "確認する" }).click();
  await next.click();
  await expect(page.getByText("ステップ9 / 9")).toBeVisible();

  await post(["仕入", "5000000"], ["現金", "5000000"]);
  await fill(["現金", "9007199254740991"], ["資本金", "9007199254740991"]);
  await expect(work.getByText("桁が多すぎます")).toHaveCount(2);
  await expect(work.getByRole("button", { name: "記帳する" })).toBeDisabled();
  await expect(results.getByText("左右の合計は一致しています。")).toBeVisible();

  await post(["現金", "9999999999999"], ["資本金", "9999999999999"]);
  await expect(results.getByText("左右の合計が一致していません")).toHaveCount(0);
  await expect(results.getByText("左右の合計は一致しています。")).toBeVisible();
});

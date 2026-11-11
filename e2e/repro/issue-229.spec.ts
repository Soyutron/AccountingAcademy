import { expect, test } from "@playwright/test";

const GENERIC = /結果の表で何が動くはずか|予想と実際の動きが違いました/;

test("売れ残りと売上原価の自然な誤答に、汎用文でない説明を返す", async ({ page }) => {
  await page.goto("/units/merchandise/cost-of-goods-sold");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const status = page.getByRole("status");
  const next = page.getByRole("button", { name: "次へ →" });
  const post = async (debit: string, credit: string, amount: string) => {
    await work.getByLabel("借方の科目1").fill(debit);
    await work.getByLabel("借方の科目1").press("Escape");
    await work.getByLabel("借方の金額1").fill(amount);
    await work.getByLabel("貸方の科目1").fill(credit);
    await work.getByLabel("貸方の科目1").press("Escape");
    await work.getByLabel("貸方の金額1").fill(amount);
    await work.getByRole("button", { name: "記帳する" }).click();
  };
  const calc = async (value: string) => {
    await work.getByPlaceholder("金額(円)").fill(value);
    await work.getByRole("button", { name: "確認する" }).click();
    await expect(status.getByText("できました")).toBeVisible();
  };
  const expectSpecific = async (word: string) => {
    await expect(status.getByText("もう一歩")).toBeVisible();
    await expect(status).toContainText(word);
    await expect(status).not.toContainText(GENERIC);
  };

  await next.click();
  await calc("110000");
  await next.click();
  // ステップ3: 振替を逆向きに予想する
  for (const [label, value] of [["資産", "減る"], ["負債", "変わらない"], ["純資産", "減る"], ["収益", "変わらない"], ["費用", "増える"]]) {
    await work.getByLabel(`${label}の予想`, { exact: true }).selectOption({ label: value });
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expectSpecific("売れ残り");
  await next.click();
  await calc("93500");
  await next.click();
  // ステップ5: 翌期首の振替
  for (const [debit, credit, word] of [["仕入", "現金", "お金"], ["現金", "繰越商品", "お金"], ["売上", "繰越商品", "売って"]]) {
    await post(debit, credit, "22000");
    await expectSpecific(word);
  }
  await post("仕入", "繰越商品", "22000");
  await expect(status.getByText("できました")).toBeVisible();
  await next.click();
  // ステップ6: 掛けの仕入
  for (const [debit, credit, word] of [["仕入", "現金", "まだ払っていません"], ["仕入", "未払金", "未払金"]]) {
    await post(debit, credit, "20000");
    await expectSpecific(word);
  }
});

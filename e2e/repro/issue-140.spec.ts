import { expect, test } from "@playwright/test";

const fill = async (work: import("@playwright/test").Locator, side: string, n: number, account: string, amount: string) => {
  await work.getByLabel(`${side}の科目${n}`).fill(account);
  await work.page().keyboard.press("Escape");
  await work.getByLabel(`${side}の金額${n}`).fill(amount);
};

// 報告された3つの支払いのうち1つを書き忘れて貸方をそろえると、汎用文だけが出ていた
test("小口現金 ステップ4: 支払いを1つ書き忘れると、抜けた支払いの説明が出る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  await page.goto("/units/cash-and-deposits/petty-cash");
  await next.click();
  await fill(work, "借方", 1, "小口現金", "30000");
  await fill(work, "貸方", 1, "当座預金", "30000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await next.click();
  await expect(page.getByText("ステップ4 / 9")).toBeVisible();
  await fill(work, "借方", 1, "通信費", "4000");
  await work.getByRole("button", { name: "行を追加" }).first().click();
  await page.keyboard.press("Escape");
  await fill(work, "借方", 2, "消耗品費", "6500");
  await fill(work, "貸方", 1, "小口現金", "10500");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("もう一歩", { exact: true })).toBeVisible();
  await expect(page.getByText("結果の表で何が動くはずかを考えて")).toHaveCount(0);
  await expect(page.getByText(/電車代2,000円の分が書かれていません/)).toBeVisible();
});

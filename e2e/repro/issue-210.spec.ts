import { expect, test } from "@playwright/test";

// Issue #210: 問題文の金額を続けて押しても、2つの金額が1つの欄の中で数字としてつながらない
test("問題文の金額を続けて押すと、次の空の金額欄に入る", async ({ page }) => {
  await page.goto("/units/merchandise/returns-and-costs");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const guide = page.getByRole("region", { name: "ガイド" });
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 8")).toBeVisible();
  const big = guide.getByRole("button", { name: "50,000円を仕訳帳に入れる" });
  const small = guide.getByRole("button", { name: "2,000円を仕訳帳に入れる" });
  const debit = work.getByLabel("借方の金額1");
  const credit = work.getByLabel("貸方の金額1");

  await big.click();
  await small.click();
  await expect(debit).toHaveValue("50,000");
  await expect(credit).toHaveValue("2000");

  // 学習者が欄をクリックした後は、従来どおりカーソル位置に挿入する(Issue #7)
  await debit.click();
  await debit.press("End");
  await small.click();
  await expect(debit).toHaveValue("50,0002000");
});

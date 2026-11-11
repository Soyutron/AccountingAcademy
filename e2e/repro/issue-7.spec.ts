import { expect, test } from "@playwright/test";

// Issue #7: 問題文の金額を押すと仕訳帳の金額欄に入る(転記の手間をなくす)
test("問題文の金額を押すと、フォーカス中の金額欄か最初の空の金額欄に入る", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await tour.getByRole("button", { name: "スキップ" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const debit = work.getByLabel("借方の金額1");
  const credit = work.getByLabel("貸方の金額1");
  const amount = page.getByRole("button", { name: "100,000円を仕訳帳に入れる" });
  await expect(amount).toBeVisible();

  // フォーカスが無いときは最初の空の金額欄へ(キーボードでも動く)
  await amount.focus();
  await page.keyboard.press("Enter");
  await expect(debit).toHaveValue("100000");
  await expect(debit).toBeFocused();

  // フォーカス中の欄にはカーソル位置に挿入する
  await credit.click();
  await credit.pressSequentially("5");
  await credit.press("ArrowLeft");
  await amount.click();
  await expect(credit).toHaveValue("1000005");
  await expect(credit).toBeFocused();

  // 空の欄が無ければ何も起きない(blur時の整形はそのまま効く)
  await work.getByText("仕訳帳に書く").click();
  await expect(credit).toHaveValue("1,000,005");
  await amount.click();
  await expect(debit).toHaveValue("100,000");
  await expect(credit).toHaveValue("1,000,005");
});

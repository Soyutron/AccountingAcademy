import { expect, test } from "@playwright/test";

// 「答えを見る」は入力を正解で埋めて結果を消すだけで、確定ボタンを押す案内が無く「次へ →」も無効のまま止まって見えた
test("post: 「答えを見る」の後に「記帳する」の案内が出て、押すと次へ進める", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).click();
  const next = page.getByRole("button", { name: "次へ →" });
  await next.click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const answer = async (debit: string, credit: string) => {
    await work.getByLabel("借方の科目1").fill(debit);
    await work.getByLabel("借方の金額1").fill("1000000");
    await work.getByLabel("貸方の科目1").fill(credit);
    await work.getByLabel("貸方の金額1").fill("1000000");
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByRole("status").getByText("もう一歩")).toBeVisible();
  };
  await answer("資本金", "現金");
  await answer("現金", "借入金");
  await page.getByRole("button", { name: "答えを見る" }).click();
  await expect(work.getByLabel("借方の科目1")).toHaveValue("現金");
  await expect(page.getByRole("status").filter({ hasText: /「記帳する」を押すと次へ進めます/ })).toBeVisible();
  await expect(page.getByText("課題ができると次へ進めます")).toHaveCount(0);
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(page.getByText(/を押すと次へ進めます/)).toHaveCount(0);
  await expect(next).not.toHaveAttribute("aria-disabled", "true");
});

test("calc: 「答えを見る」の後に「確認する」の案内が出る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const wrong = page.getByRole("status").filter({ hasText: "もう一歩" });
  const next = page.getByRole("button", { name: "次へ →" });
  // ステップ2がpredict(答えれば進める)、ステップ3がcalc
  await page.goto("/units/depreciation/what-is-depreciation");
  await next.click();
  for (const el of ["資産", "負債", "純資産", "収益", "費用"]) {
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption({ index: 1 });
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(next).not.toHaveAttribute("aria-disabled", "true");
  await next.click();
  const amount = work.getByPlaceholder("金額(円)");
  const confirm = work.getByRole("button", { name: "確認する" });
  await amount.fill("11");
  await confirm.click();
  await expect(wrong).toBeVisible();
  await amount.fill("22");
  await confirm.click();
  await expect(wrong).toBeVisible();
  await page.getByRole("button", { name: "答えを見る" }).click();
  await expect(page.getByRole("status").filter({ hasText: /「確認する」を押すと次へ進めます/ })).toBeVisible();
  await confirm.click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(next).not.toHaveAttribute("aria-disabled", "true");
});

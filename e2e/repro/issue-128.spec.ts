import { expect, test } from "@playwright/test";

test("post: 答えを見た後に直前の誤答を打ち直すと、説明がもう一度出る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const post = async (debit: string) => {
    await work.getByLabel("借方の科目 1").fill(debit);
    await page.keyboard.press("Escape");
    await work.getByLabel("借方の金額 1").fill("200000");
    await work.getByLabel("貸方の科目 1").fill("売上");
    await page.keyboard.press("Escape");
    await work.getByLabel("貸方の金額 1").fill("200000");
    await work.getByRole("button", { name: "記帳する" }).click();
  };
  const wrong = page.getByRole("status").filter({ hasText: "もう一歩" });
  await page.goto("/units/cash-and-deposits/checking-account");
  await page.getByRole("button", { name: "次へ →" }).click();
  await post("現金");
  await expect(wrong).toBeVisible();
  await post("備品");
  await expect(wrong).toBeVisible();
  await page.getByRole("button", { name: "答えを見る" }).click();
  await expect(wrong).toHaveCount(0);
  await post("備品");
  await expect(wrong).toBeVisible({ timeout: 5_000 });
});

test("calc: 答えを見た後に直前の誤答を打ち直すと、説明がもう一度出る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const wrong = page.getByRole("status").filter({ hasText: "もう一歩" });
  const next = page.getByRole("button", { name: "次へ →" });
  // ステップ 2 が predict(答えれば進める)、ステップ 3 が calc
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
  await expect(wrong).toHaveCount(0);
  await amount.fill("22");
  await confirm.click();
  await expect(wrong).toBeVisible({ timeout: 5_000 });
});

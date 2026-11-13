import { expect, test } from "@playwright/test";

// Issue #10: predictを誤答して進めた状態(記帳済みの仕訳と有効な「次へ →」)が、再訪して「続きから」を押すと失われていた
test("predictを誤答して記帳したあとreloadしても、記帳と「次へ →」が戻る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const result = page.getByRole("region", { name: "結果" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = page.getByText("できました", { exact: true });
  await page.goto("/units/depreciation/straight-line");
  await next.click();
  await work.getByLabel("借方の科目1").fill("車両運搬具");
  await work.getByLabel("借方の金額1").fill("1200000");
  await work.getByLabel("貸方の科目1").fill("現金");
  await work.getByLabel("貸方の金額1").fill("1200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(done).toBeVisible();
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
  await expect(page.getByText("ステップ6 / 9")).toBeVisible();
  for (const [el, v] of [["資産", "none"], ["負債", "increase"], ["純資産", "none"], ["収益", "none"], ["費用", "increase"]])
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/attempts"));
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("もう一歩")).toBeVisible();
  await expect(result.getByText("減価償却累計額")).toBeVisible();
  await expect(next).toHaveAttribute("aria-disabled", "false");
  await saved;

  await page.evaluate(() => sessionStorage.clear());

  await page.reload();
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByText("ステップ6 / 9")).toBeVisible();
  // 離脱前と同じ: 記帳済みの仕訳、誤答の説明、有効な「次へ →」。予想は選んだままで変えられない
  await expect(result.getByText("減価償却累計額")).toBeVisible();
  await expect(page.getByText("もう一歩")).toBeVisible();
  await expect(next).toHaveAttribute("aria-disabled", "false");
  await expect(work.getByLabel("負債の予想", { exact: true })).toHaveValue("increase");
  await expect(work.getByLabel("負債の予想", { exact: true })).toBeDisabled();
});

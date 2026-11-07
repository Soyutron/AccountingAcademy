import { expect, test } from "@playwright/test";

// Issue #11: predict の「これから記帳する仕訳」に 5 要素の増減がそのまま出て、予想する前に答えが見えていた
test("predict: 予想を送るまで「これから記帳する仕訳」に要素の増減を出さず、送ったあとは出る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = page.getByText("できました", { exact: true });
  await page.goto("/units/depreciation/straight-line");
  await next.click();
  await work.getByLabel("借方の科目 1").fill("車両運搬具");
  await work.getByLabel("借方の金額 1").fill("1200000");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await work.getByLabel("貸方の金額 1").fill("1200000");
  // post では入力に応じた影響表示が出る(従来どおり)
  await expect(work.locator('[data-tour="impact"]')).toBeVisible();
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
  await expect(page.getByText("ステップ 6 / 9")).toBeVisible();
  await expect(work.getByText("これから記帳する仕訳")).toBeVisible();
  await expect(work.locator('[data-tour="impact"]')).toHaveCount(0);
  await expect(work.getByText("−100,000")).toHaveCount(0);
  await expect(work.getByText("+100,000")).toHaveCount(0);

  for (const [el, v] of [["資産", "decrease"], ["負債", "none"], ["純資産", "decrease"], ["収益", "none"], ["費用", "increase"]])
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(done).toBeVisible();
  // 送ったあとは「あなたの予想 / 実際」と並んで影響表示も出る
  await expect(page.getByText("あなたの予想")).toBeVisible();
  await expect(work.locator('[data-tour="impact"]')).toBeVisible();
});

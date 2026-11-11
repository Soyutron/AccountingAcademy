import { expect, test } from "@playwright/test";

// Issue #12: 費用の仕訳を記帳しても「このステップで動いた要素」に純資産が出ず、predictの正解(純資産 減る)と食い違っていた
test("費用の仕訳のあと「このステップで動いた要素」に純資産も並ぶ", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
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
  // 資産どうしの仕訳(車両運搬具 / 現金)では要素は動かない(資産の増減が相殺される)
  const effect = page.getByRole("region", { name: "結果" }).getByRole("region", { name: "このステップの影響" });
  await expect(effect).toHaveCount(0);
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
  for (const [el, v] of [["資産", "decrease"], ["負債", "none"], ["純資産", "decrease"], ["収益", "none"], ["費用", "increase"]])
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(done).toBeVisible();
  const equity = effect.getByRole("listitem").filter({ hasText: "純資産" });
  await expect(equity).toBeVisible();
  await expect(equity).toContainText("減少");
  await expect(equity).toContainText("100,000");
  await expect(effect.getByRole("listitem").filter({ hasText: "費用" })).toContainText("増加");
});

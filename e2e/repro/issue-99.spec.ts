import { expect, test } from "@playwright/test";

// 資産がマイナスのとき、行は「△100,000」なのに合計欄は「-100,000」と別の記号になる
test("マイナスの合計は行と同じ △ で表示する", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  await page.goto("/units/tutorial/first-entry");
  const skip = page.getByRole("dialog", { name: "チュートリアル" }).getByRole("button", { name: "スキップ" });
  await skip.click({ timeout: 5000 }).catch(() => {});
  await next.click();
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("100000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await next.click();
  await expect(page.getByText("ステップ 4 / 4")).toBeVisible();
  await work.getByLabel("借方の科目 1").fill("資本金");
  await work.getByLabel("借方の金額 1").fill("200000");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await work.getByLabel("貸方の金額 1").fill("200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const bs = page.getByRole("region", { name: "貸借対照表" });
  await expect(bs.getByText("△").first()).toBeVisible();
  await expect(bs.getByText("-100,000")).toHaveCount(0);
  // 符号を落とすだけの修正を防ぐため、合計欄そのものに △ と金額があることまで確かめる
  await expect(bs.getByText("資産合計", { exact: true }).locator("..")).toContainText("△マイナス 100,000");
  await expect(bs.getByText("負債・純資産合計", { exact: true }).locator("..")).toContainText("△マイナス 100,000");
});

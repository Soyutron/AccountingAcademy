import { expect, test } from "@playwright/test";

// Issue #199: 課題の post は不一致でも押せて採点されるのに、「使い方」は「合計がそろうまで押せません」と説明していた
test("不一致のまま「記帳する」を押せる post ステップで、「使い方」が押せないと説明しない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("dialog", { name: "チュートリアル" }).getByRole("button", { name: "スキップ" }).click({ timeout: 5000 }).catch(() => {});
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("900000");
  await page.keyboard.press("Escape");
  await expect(work.getByText("不一致")).toBeVisible();
  const post = work.getByRole("button", { name: "記帳する" });
  await expect(post).toBeEnabled();

  await page.getByRole("button", { name: "使い方" }).click();
  const help = page.getByRole("dialog").first();
  await expect(help).toContainText("そろえるよう案内が出ます");
  await expect(help).not.toContainText("合計がそろうまで「記帳する」は押せません");
  await page.keyboard.press("Escape");
  await expect(help).toBeHidden();

  await post.click();
  await expect(page.getByText("もう一歩")).toBeVisible();
  await expect(page.getByText("左の合計と右の合計がそろっていません")).toBeVisible();
});

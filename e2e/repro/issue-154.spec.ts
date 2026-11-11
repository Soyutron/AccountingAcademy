import { expect, test } from "@playwright/test";

// Issue #154: 本文が「結果の貸借対照表を見ずに計算して」と言うcalcの直下に「結果の表を読んで答えましょう」と出ていた
test("「見ずに計算して」と言うcalcの「やること」と初回の注記が、表を読めと指示しない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const field = async (label: string, value: string) => {
    await work.getByLabel(label).fill(value);
    await page.keyboard.press("Escape");
  };
  const post = async (debit: string, credit: string, amount: string) => {
    await field("借方の科目1", debit);
    await field("借方の金額1", amount);
    await field("貸方の科目1", credit);
    await field("貸方の金額1", amount);
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(next).not.toHaveAttribute("aria-disabled", "true");
    await next.click();
  };

  await page.goto("/units/cash-and-deposits/checking-account");
  await next.click();
  await post("当座預金", "普通預金", "200000");
  for (const [el, value] of [["資産", "decrease"], ["負債", "decrease"], ["純資産", "none"], ["収益", "none"], ["費用", "none"]]) {
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(value);
  }
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(next).not.toHaveAttribute("aria-disabled", "true");
  await next.click();
  await post("仕入", "当座預金", "25000");
  await post("現金", "売上", "30000");

  await expect(page.getByText("ステップ6 /")).toBeVisible();
  const guide = page.getByRole("region", { name: "ガイド" });
  await expect(guide).toContainText("結果の貸借対照表を見ずに計算してから");
  const instruction = guide.getByText(/^やること:/);
  await expect(instruction).toBeVisible();
  await expect(instruction).not.toContainText("結果の表を読んで");

  const note = page.getByRole("note", { name: "初めての「金額で答える」" });
  await expect(note).toBeVisible();
  await expect(note).not.toContainText("結果の表や問題文から");
});

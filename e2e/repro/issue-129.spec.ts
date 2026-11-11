import { expect, test } from "@playwright/test";

test("誤答の後に入力を直しても、比較表の「あなたの仕訳」は採点した答えのまま", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const field = async (label: string, value: string) => {
    await work.getByLabel(label).fill(value);
    await page.keyboard.press("Escape");
  };
  const box = page.getByRole("status").filter({ hasText: "もう一歩" });
  const yours = box.locator("tbody tr td:nth-child(2)");
  await page.goto("/units/merchandise/returns-and-costs");
  await page.getByRole("button", { name: "次へ →" }).click();
  await field("借方の科目1", "現金");
  await field("借方の金額1", "1");
  await field("貸方の科目1", "売上");
  await field("貸方の金額1", "1");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(box).toBeVisible();
  const graded = ["+1", "±0", "+1", "+1", "±0"];
  await expect(yours).toHaveText(graded);

  await field("借方の科目1", "仕入");
  await field("借方の金額1", "52000");
  await field("貸方の科目1", "買掛金");
  await field("貸方の金額1", "50000");
  await work.getByRole("button", { name: "行を追加" }).nth(1).click();
  await page.keyboard.press("Escape");
  await field("貸方の科目2", "現金");
  await field("貸方の金額2", "2000");
  await page.getByRole("region", { name: "ガイド" }).click();
  await expect(yours).toHaveText(graded);

  // 片側を空にしても、採点した答えについての表は消えない
  await field("借方の科目1", "");
  await field("借方の金額1", "");
  await expect(yours).toHaveText(graded);

  // 別の誤答を記帳し直すと、表はその答えに更新される
  await field("借方の科目1", "現金");
  await field("借方の金額1", "52000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(yours).not.toHaveText(graded);
});

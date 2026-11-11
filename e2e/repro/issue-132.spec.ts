import { expect, test } from "@playwright/test";

// Issue #132: 当座預金への振り替えで左を「預金」と書くと、普通預金に読まれて汎用文だけが出ていた
test("当座預金の振り替えで左を「預金」と書くと、普通預金に読まれたことが分かる説明が出る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const field = async (label: string, value: string) => {
    await work.getByLabel(label).fill(value);
    await page.keyboard.press("Escape");
  };
  await page.goto("/units/cash-and-deposits/checking-account");
  await page.getByRole("button", { name: "次へ →" }).click();
  await field("借方の科目1", "預金");
  await field("借方の金額1", "200000");
  await field("貸方の科目1", "普通預金");
  await field("貸方の金額1", "200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const box = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(box).toBeVisible();
  await expect(box.filter({ hasText: "まだ合っていません" })).toHaveCount(0);
  await expect(box).toContainText("普通預金として読まれます");
});

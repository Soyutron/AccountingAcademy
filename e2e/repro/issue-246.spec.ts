import { expect, test } from "@playwright/test";

// 学習中のタブは、別タブが localStorage を消しても初回バナーを出さない
test("別タブの localStorage.clear で、学習途中のタブに初回バナーが出ない", async ({ context, page }) => {
  const banner = page.getByRole("note").filter({ hasText: "初めてですか" });
  await page.goto("/units/bookkeeping-basics/five-elements");
  await expect(banner).toBeVisible();
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();

  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する", exact: true }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  await expect(banner).toHaveCount(0);

  const other = await context.newPage();
  await other.goto("/glossary");
  await other.evaluate(() => localStorage.clear());

  await page.waitForTimeout(1000);
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  await expect(banner).toHaveCount(0);
});

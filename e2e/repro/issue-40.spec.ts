import { devices, expect, test } from "@playwright/test";

// スマホ幅(1 ペインずつのタブ表示)でも、ツアーが対象のあるペインへ切り替える

test.use({ ...devices["iPhone 13"] });

test("スマホ幅のツアーで対象のあるペインが表示される", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  const next = tour.getByRole("button", { name: "次へ", exact: true });
  await tour.getByRole("button", { name: "はじめる" }).click();
  await next.click();
  await page.getByRole("button", { name: "次へ →" }).click();

  await expect(tour).toContainText("4 / 12");
  await expect(page.getByRole("tab", { name: "ワークスペース" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("借方の科目 1")).toBeVisible();
  await page.getByLabel("借方の科目 1").fill("現金");
  await page.getByLabel("借方の金額 1").fill("100000");
  await next.click();

  await expect(tour).toContainText("5 / 12");
  await expect(page.getByLabel("貸方の科目 1")).toBeVisible();
  await page.getByLabel("貸方の科目 1").fill("資本金");
  await page.getByLabel("貸方の金額 1").fill("100000");
  await next.click(); // 影響の説明
  await next.click(); // 記帳する待ち
  await page.getByRole("region", { name: "ワークスペース" }).getByRole("button", { name: "記帳する" }).click();

  await expect(tour).toContainText("8 / 12");
  await expect(page.getByRole("region", { name: "結果" })).toBeVisible();
  await next.click(); // 会社のかたち
  await next.click(); // 迷ったら

  await expect(tour).toContainText("10 / 12");
  await expect(page.getByRole("region", { name: "ガイド" })).toBeVisible();
});

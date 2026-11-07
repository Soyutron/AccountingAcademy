import { expect, test } from "@playwright/test";

// 借方・貸方の金額を打ち間違えたら、ツアーは「影響がその場で見える」へ進まないこと
test("ツアーは借方・貸方の金額が違うまま 6 段目へ進まない", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = tour.getByRole("button", { name: "次へ" });
  await tour.getByRole("button", { name: "はじめる" }).click();
  await next.click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await next.click();

  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("10000");
  await expect(next).toBeDisabled();
  await work.getByLabel("借方の金額 1").fill("100000");
  await expect(next).toBeEnabled();
  await next.click();

  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("10000");
  await expect(next).toBeDisabled();
  await work.getByLabel("貸方の金額 1").fill("100000");
  await expect(next).toBeEnabled();
  await next.click();
  await expect(tour.getByText("影響がその場で見える")).toBeVisible();
});

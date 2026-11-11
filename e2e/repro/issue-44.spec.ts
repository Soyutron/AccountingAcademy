import { expect, test } from "@playwright/test";

// ツアーはステップ0からの台本なので、ツアー中は「続きから」を出さない。ツアーを抜ければ出る

test("チュートリアルを途中で離れて戻っても、ツアー中は「続きから」が出ず、スキップ後に出る", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await tour.getByRole("button", { name: "はじめる" }).click();
  await tour.getByRole("button", { name: "次へ", exact: true }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 4")).toBeVisible();

  await page.reload();
  await expect(tour).toBeVisible();
  await expect(page.getByRole("button", { name: "続きから" })).toHaveCount(0);

  await tour.getByRole("button", { name: "スキップ" }).click();
  await expect(tour).toHaveCount(0);
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByText("ステップ3 / 4")).toBeVisible();
});

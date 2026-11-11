import { expect, test, type Page } from "@playwright/test";

// Issue #96: 仕訳欄の無いステップ1へ戻っても、ツアーが記入の段に残って進めなくなっていた

const tourOf = (page: Page) => page.getByRole("dialog", { name: "チュートリアル" });
const nextOf = (page: Page) => tourOf(page).getByRole("button", { name: "次へ", exact: true });

// ツアーの案内どおりに4/12「借方(左)に書く」まで進める
async function advanceToDebit(page: Page) {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const tour = tourOf(page);
  await tour.getByRole("button", { name: "はじめる" }).click({ timeout: 15000 });
  await nextOf(page).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(tour).toContainText("借方(左)に書く");
}

test("記入の段で「← 前へ」を押すと3/12に戻り、「次へ →」で4/12へ進み直せる", async ({ page }) => {
  await advanceToDebit(page);
  const tour = tourOf(page);

  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(page.getByText("ステップ1 / 4")).toBeVisible();
  await expect(page.getByLabel("借方の科目1")).toHaveCount(0);
  await expect(tour).not.toContainText("借方(左)に書く");
  await expect(tour).toContainText("3 / 12");
  await expect(tour).toContainText("次へ進む");

  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(tour).toContainText("4 / 12");
  await expect(tour).toContainText("借方(左)に書く");
  await expect(page.getByLabel("借方の科目1")).toBeVisible();
});

test("記帳した後の段で「← 前へ」を押しても3/12に戻り、最後の段まで進める", async ({ page }) => {
  await advanceToDebit(page);
  const tour = tourOf(page);
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await nextOf(page).click();
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await nextOf(page).click();
  await nextOf(page).click();
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(tour).toContainText("8 / 12");

  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect(tour).toContainText("3 / 12");

  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(tour).toContainText("4 / 12");
  await expect(nextOf(page)).toBeEnabled();
  await nextOf(page).click();
  await nextOf(page).click();
  await nextOf(page).click();
  await expect(tour).toContainText("8 / 12");
});

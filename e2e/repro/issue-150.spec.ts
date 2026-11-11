import { expect, test, type Page } from "@playwright/test";

// Issue #150: チュートリアルの最終ステップから、本文が案内する最初の単元へ進める
const firstUnit = "/units/bookkeeping-basics/five-elements";

async function reachLastStep(page: Page) {
  const next = page.getByRole("button", { name: "次へ →" });
  const work = page.getByRole("region", { name: "ワークスペース" });
  await next.click();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(next).toHaveAttribute("aria-disabled", "false");
  await next.click();
  await next.click();
  await expect(page.getByText("ステップ4 / 4")).toBeVisible();
}

test("ツアーをスキップしても、最終ステップから最初の単元へ進める", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  await page.getByRole("dialog", { name: "チュートリアル" }).getByRole("button", { name: "スキップ" }).click();
  await reachLastStep(page);

  await page.locator(`main a[href="${firstUnit}"]`).click();
  await expect(page).toHaveURL(new RegExp(`${firstUnit}$`));
});

test("ツアーの途中で最終ステップのリンクから進むと、次の単元でチュートリアルを勧めない", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await tour.getByRole("button", { name: "はじめる" }).click();
  await tour.getByRole("button", { name: "次へ" }).click();
  await reachLastStep(page);

  await expect(tour).toBeVisible();
  await page.locator(`main a[href="${firstUnit}"]`).click();
  await expect(page).toHaveURL(new RegExp(`${firstUnit}$`));
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  await expect(page.getByText("初めてですか?")).toHaveCount(0);
});

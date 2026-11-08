import { expect, test, type Page } from "@playwright/test";

// Issue #81: 閉じたツアーが reload で始まり直し、完了の記録が skipped に上書きされていた

const tutorial = "/units/tutorial/first-entry";
const tourOf = (page: Page) => page.getByRole("dialog", { name: "チュートリアル" });
const status = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("tutorial-state") ?? "{}").status);

async function advanceToLastCard(page: Page) {
  const tour = tourOf(page);
  await tour.getByRole("button", { name: "はじめる" }).click();
  await tour.getByRole("button", { name: "次へ" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("100000");
  await tour.getByRole("button", { name: "次へ" }).click();
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("100000");
  await tour.getByRole("button", { name: "次へ" }).click();
  await tour.getByRole("button", { name: "次へ" }).click();
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  for (let i = 0; i < 4; i++) await tour.getByRole("button", { name: "次へ" }).click();
  await expect(tour).toContainText("12 / 12");
}

async function expectNoTourAfterReload(page: Page) {
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/ステップ 1 \/ 4/).first()).toBeVisible();
  await expect(tourOf(page)).toHaveCount(0);
}

test("?tour=1 で始めたツアーをスキップすると URL から消え、reload しても始まり直さない", async ({ page }) => {
  await page.goto(`${tutorial}?tour=1`);
  const tour = tourOf(page);
  await tour.getByRole("button", { name: "スキップ" }).click();
  await expect(tour).toHaveCount(0);
  expect(page.url()).not.toContain("tour=1");
  await expectNoTourAfterReload(page);
});

test("自動で始まったツアーをスキップして reload しても、始まり直さない", async ({ page }) => {
  await page.goto(tutorial);
  const tour = tourOf(page);
  await tour.getByRole("button", { name: "スキップ" }).click();
  await expect(tour).toHaveCount(0);
  await expectNoTourAfterReload(page);
});

test("完了後に「使い方」からやり直してスキップしても、完了の記録が残る", async ({ page }) => {
  await page.goto(tutorial);
  await advanceToLastCard(page);
  const tour = tourOf(page);
  await tour.getByRole("button", { name: "閉じる" }).first().click();
  await expect(tour).toHaveCount(0);
  expect(await status(page)).toBe("done");

  await page.getByRole("button", { name: "使い方" }).click();
  await page.getByRole("button", { name: "チュートリアルを最初から" }).click();
  await expect(tour).toBeVisible();
  await tour.getByRole("button", { name: "スキップ" }).click();
  await expect(tour).toHaveCount(0);
  expect(await status(page)).toBe("done");
});

test("スキップ済みでも、通常の単元の「使い方」からやり直せば始まる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.evaluate(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "skipped", enabled: true })));
  await page.reload();
  await page.getByRole("button", { name: "使い方" }).click();
  await page.getByRole("link", { name: "チュートリアルを最初から" }).click();
  const tour = tourOf(page);
  await expect(tour).toBeVisible();
  await expect(page).toHaveURL(/tour=1/);
  await tour.getByRole("button", { name: "スキップ" }).click();
  await expect(tour).toHaveCount(0);
  await expectNoTourAfterReload(page);
});

test("?tour=1 のツアーの最後から、次の単元へ移動できる", async ({ page }) => {
  await page.goto(`${tutorial}?tour=1`);
  await advanceToLastCard(page);
  await tourOf(page).getByRole("link", { name: "3 級パスの最初の単元へ" }).click();
  await expect(page).toHaveURL(/\/units\/bookkeeping-basics\/five-elements$/);
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
});

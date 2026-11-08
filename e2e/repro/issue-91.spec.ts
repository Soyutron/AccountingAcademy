import { devices, expect, test, type Page } from "@playwright/test";

// Issue #91: 操作を待つ段(3/12・7/12)が、操作の済んだ後も操作前の文言のまま残っていた

const tourOf = (page: Page) => page.getByRole("dialog", { name: "チュートリアル" });

// ツアーの案内どおりに 7/12「記帳する」まで進める
async function advanceToPost(page: Page) {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const tour = tourOf(page);
  const next = tour.getByRole("button", { name: "次へ", exact: true });
  await tour.getByRole("button", { name: "はじめる" }).click({ timeout: 15000 });
  await next.click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(tour).toContainText("4 / 12");
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("100000");
  await next.click();
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("100000");
  await next.click();
  await next.click();
  await expect(tour).toContainText("7 / 12");
  await work.getByRole("button", { name: "記帳する" }).click();
}

// カードが移動を終えてから測るため、少し待って位置を読む
async function expectCardClearOfStatus(page: Page) {
  const status = page.getByRole("status").filter({ hasText: "できました" });
  await expect(status).toBeVisible();
  await page.waitForTimeout(800);
  const card = await tourOf(page).getByRole("group").boundingBox();
  const box = await status.boundingBox();
  const overlap = Math.max(0, Math.min(card!.y + card!.height, box!.y + box!.height) - Math.max(card!.y, box!.y));
  expect(overlap).toBe(0);
}

test.describe("390px", () => {
  const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];
  test.use(iPhone);

  test("記帳するとカードが 8/12 へ進み、「できました」の説明に被らない", async ({ page }) => {
    await advanceToPost(page);
    await expect(tourOf(page)).toContainText("8 / 12");
    await expect(tourOf(page)).not.toContainText("「記帳する」を押します");
    await expect(page.getByRole("region", { name: "結果" })).toBeVisible();
    await expectCardClearOfStatus(page);
  });
});

test.describe("1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("本体の「次へ →」を押すとカードが 4/12 へ進む", async ({ page }) => {
    await page.goto("/units/tutorial/first-entry?tour=1");
    const tour = tourOf(page);
    await tour.getByRole("button", { name: "はじめる" }).click({ timeout: 15000 });
    await tour.getByRole("button", { name: "次へ", exact: true }).click();
    await expect(tour).toContainText("3 / 12");
    await page.getByRole("button", { name: "次へ →" }).click();
    await expect(tour).toContainText("4 / 12");
    await expect(tour).not.toContainText("「次へ →」を押して");
  });

  test("記帳するとカードが 8/12 へ進み、「できました」の説明に被らない", async ({ page }) => {
    await advanceToPost(page);
    await expect(tourOf(page)).toContainText("8 / 12");
    await expectCardClearOfStatus(page);
  });

  test("入力の段は金額が合っても勝手に進まない", async ({ page }) => {
    await page.goto("/units/tutorial/first-entry?tour=1");
    const tour = tourOf(page);
    await tour.getByRole("button", { name: "はじめる" }).click({ timeout: 15000 });
    await tour.getByRole("button", { name: "次へ", exact: true }).click();
    await page.getByRole("button", { name: "次へ →" }).click();
    const work = page.getByRole("region", { name: "ワークスペース" });
    await work.getByLabel("借方の科目 1").fill("現金");
    const amount = work.getByLabel("借方の金額 1");
    await amount.fill("100000");
    await expect(tour.getByRole("button", { name: "次へ", exact: true })).toBeEnabled();
    await expect(tour).toContainText("4 / 12");
    await expect(amount).toBeFocused();
  });
});

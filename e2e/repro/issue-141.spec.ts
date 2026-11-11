import { expect, test, type Page } from "@playwright/test";

// Issue #141: クリックやキーボードで固定した用語が、マウスを外すと閉じ、開き直すと展開だけ残っていた

const popover = (page: Page) => page.locator("[data-slot=popover-content]");
const firstTerm = (page: Page) => page.locator("button.term").first();

async function pinByClick(page: Page) {
  await page.goto("/units/depreciation/straight-line");
  await firstTerm(page).hover();
  await expect(popover(page)).toBeVisible();
  await firstTerm(page).click();
}

async function moveIntoPopover(page: Page) {
  const box = (await popover(page).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
}

test("クリックで固定して「もっと見る」まで開いた用語は、マウスを外しても閉じない", async ({ page }) => {
  await pinByClick(page);
  await moveIntoPopover(page);
  await popover(page).getByRole("button", { name: "もっと見る" }).click();
  await expect(popover(page).getByText("用語集で見る")).toBeVisible();
  await page.mouse.move(640, 700, { steps: 5 });
  await page.waitForTimeout(800);
  await expect(popover(page).getByText("用語集で見る")).toBeVisible();
});

test("クリックで固定しただけの用語も、マウスを外しても閉じない", async ({ page }) => {
  await pinByClick(page);
  await page.mouse.move(640, 700, { steps: 5 });
  await page.waitForTimeout(800);
  await expect(popover(page)).toBeVisible();
});

test("固定した用語をEscで閉じるとフォーカスが用語へ戻り、開き直すと「もっと見る」から始まる", async ({ page }) => {
  await pinByClick(page);
  await moveIntoPopover(page);
  await popover(page).getByRole("button", { name: "もっと見る" }).click();
  await expect(popover(page).getByText("用語集で見る")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popover(page)).toHaveCount(0);
  await expect(firstTerm(page)).toBeFocused();
  await page.mouse.move(640, 700, { steps: 5 });
  await firstTerm(page).hover();
  await expect(popover(page).getByRole("button", { name: "もっと見る" })).toBeVisible();
});

test("固定した用語は外側のクリックで閉じる", async ({ page }) => {
  await pinByClick(page);
  await page.mouse.click(640, 700);
  await expect(popover(page)).toHaveCount(0);
});

test("Enterで開いた用語は、マウスが用語の上を通過しても閉じない", async ({ page }) => {
  await page.goto("/units/depreciation/straight-line");
  await firstTerm(page).focus();
  await page.keyboard.press("Enter");
  await expect(popover(page)).toBeVisible();
  await firstTerm(page).hover();
  await page.mouse.move(640, 700, { steps: 5 });
  await page.waitForTimeout(800);
  await expect(popover(page)).toBeVisible();
});

test("ホバーのまま「もっと見る」を押してマウスを外して閉じても、開き直すと「もっと見る」から始まる", async ({ page }) => {
  await page.goto("/units/depreciation/straight-line");
  await firstTerm(page).hover();
  await expect(popover(page)).toBeVisible();
  await moveIntoPopover(page);
  await popover(page).getByRole("button", { name: "もっと見る" }).click();
  await expect(popover(page).getByText("用語集で見る")).toBeVisible();
  await page.mouse.move(640, 700, { steps: 5 });
  await expect(popover(page)).toHaveCount(0);
  await firstTerm(page).hover();
  await expect(popover(page).getByRole("button", { name: "もっと見る" })).toBeVisible();
});

test("クリックで固定した用語から別の用語へマウスを移すと、移った先の説明が消えず、固定も残る", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();

  await page.getByRole("region", { name: "ガイド" }).locator("button.term", { hasText: "仕訳" }).first().click();
  await expect(popover(page)).toHaveAttribute("aria-label", "仕訳");
  await page.getByRole("region", { name: "結果" }).locator("button.term").first().hover();
  await expect(page.locator('[data-slot=popover-content][aria-label="現金"]')).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator('[data-slot=popover-content][aria-label="現金"]')).toBeVisible();
  await expect(page.locator('[data-slot=popover-content][aria-label="仕訳"]')).toBeVisible();
});

import { expect, type Page, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

// ガイドが長く、「ヒントを見る」が初期状態でペインの外にあるステップ
async function openStepThree(page: Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByLabel("借方の科目1").fill("現金");
  await page.keyboard.press("Enter");
  await page.getByLabel("借方の金額1").fill("1000000");
  await page.getByLabel("貸方の科目1").fill("資本金");
  await page.keyboard.press("Enter");
  await page.getByLabel("貸方の金額1").fill("1000000");
  await page.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status")).toContainText("できました");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
}

async function showHintTarget(page: Page) {
  await page.getByRole("button", { name: "使い方", exact: true }).click();
  const help = page.getByRole("dialog", { name: "会計IDEの使い方" });
  await help.getByRole("button", { name: /場所を示す/ }).first().click();
  await expect(help).toBeHidden();
  await expect(page.locator('[data-spotlight="hint"]')).toBeAttached();
}

const hintInPane = (page: Page) =>
  page.evaluate(() => {
    const target = document.querySelector('[data-tour="hint"]')!.getBoundingClientRect();
    const pane = document.querySelector("#pane-guide")!.getBoundingClientRect();
    return target.top >= pane.top && target.bottom <= pane.bottom;
  });

test("「場所を示す」は、ペインの外にある対象をスクロールして見える位置に出す", async ({ page }) => {
  await openStepThree(page);
  await showHintTarget(page);
  await expect.poll(() => hintInPane(page)).toBe(true);
});

test("「場所を示す」は、既に見えている対象ではペインを動かさない", async ({ page }) => {
  await openStepThree(page);
  const before = await page.evaluate(() => {
    document.querySelector('[data-tour="hint"]')!.scrollIntoView({ block: "end" });
    return document.querySelector("#pane-guide")!.scrollTop;
  });
  expect(before).toBeGreaterThan(0);
  expect(await hintInPane(page)).toBe(true);

  await showHintTarget(page);
  // 判定は300msごとの計測で行われるので、動くならこの間に動く
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => document.querySelector("#pane-guide")!.scrollTop)).toBe(before);
});

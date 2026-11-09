import { expect, test } from "@playwright/test";

const TRANSACTION = /知り合いの焼き菓子店/;

async function openPostStep(page: import("@playwright/test").Page) {
  await page.goto("/units/receivables-and-payables/loans");
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).first().click();
}

// Issue #149: スマホ幅ではガイドが隠れるので、ワークスペースタブにも取引文を出す
test.describe("スマホ幅", () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

  test("ワークスペースタブに問題の取引文が見え、金額を押すと仕訳帳に入る", async ({ page }) => {
    await openPostStep(page);
    await page.getByRole("tab", { name: "ワークスペース" }).click();
    const work = page.getByRole("region", { name: "ワークスペース" });
    await expect(work.getByText(TRANSACTION)).toBeVisible();

    await work.getByRole("button", { name: "100,000 円を仕訳帳に入れる" }).tap();
    await expect(page.locator('[data-amount-field="debit-0"]')).toHaveValue("100000");
  });
});

test.describe("PC 幅", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("取引文はガイドの 1 か所だけに見える", async ({ page }) => {
    await openPostStep(page);
    await expect(page.getByRole("region", { name: "ガイド" }).getByText(TRANSACTION)).toBeVisible();
    await expect(page.getByText(TRANSACTION).filter({ visible: true })).toHaveCount(1);
  });
});

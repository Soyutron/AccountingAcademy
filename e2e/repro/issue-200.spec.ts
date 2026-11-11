import { expect, type Page, test } from "@playwright/test";

// Issue #200: tweakを達成してもフォーカスがスライダーに残り、「次へ →」まで結果ペインの用語を全部通っていた
async function tabsToNext(page: Page) {
  let tabs = 0;
  for (; tabs < 30; tabs++) {
    const label = await page.evaluate(() => document.activeElement?.textContent ?? "");
    if (label.includes("次へ")) break;
    await page.keyboard.press("Tab");
  }
  return tabs;
}

test("条件を変えるの達成後、状態欄へフォーカスが移り「次へ →」までTab 3回以内で届く", async ({ page }) => {
  await page.goto("/units/depreciation/straight-line");
  const later = page.getByRole("button", { name: "今はしない" });
  if (await later.isVisible()) await later.click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("車両運搬具");
  await work.getByLabel("借方の金額1").fill("1200000");
  await work.getByLabel("貸方の科目1").fill("現金");
  await work.getByLabel("貸方の金額1").fill("1200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 9")).toBeVisible();

  // ステップ3: 耐用年数を4 → 6年
  const life = work.getByRole("slider", { name: "耐用年数" });
  await life.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(life).toHaveValue("6");
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeFocused();
  expect(await tabsToNext(page)).toBeLessThanOrEqual(3);

  // ステップ4: 残存価額を0 → 300,000円(後ろに耐用年数のスライダーがある)
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ4 / 9")).toBeVisible();
  const residual = work.getByRole("slider", { name: "残存価額" });
  await residual.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
  await expect(residual).toHaveValue("300000");
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeFocused();
  expect(await tabsToNext(page)).toBeLessThanOrEqual(3);
});

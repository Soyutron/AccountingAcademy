import { devices, expect, test } from "@playwright/test";

// Issue #269: 390×664のツアー6/12で、本文が指す借方・貸方の合計の行が下の固定フッターに隠れていた

const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];
test.use(iPhone);

test("ツアー6/12で合計の行が固定フッターに隠れない(390×664)", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const dialog = page.getByRole("dialog", { name: "チュートリアル" });
  const next = dialog.getByRole("button", { name: "次へ", exact: true });
  await dialog.getByRole("button", { name: "はじめる" }).tap({ timeout: 15000 });
  await next.tap();
  await page.getByRole("button", { name: "次へ →" }).tap();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await next.tap();
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await next.tap();
  await expect(dialog.locator("#tutorial-tour-title")).toHaveText("影響がその場で見える");
  await page.waitForTimeout(500);

  const totals = await work.getByText(/借方合計/).first().boundingBox();
  const footerTop = await page.getByRole("button", { name: "次へ →" }).evaluate((el) => {
    let e: HTMLElement | null = el as HTMLElement;
    while (e && getComputedStyle(e).position !== "sticky") e = e.parentElement;
    return e!.getBoundingClientRect().top;
  });
  expect(totals!.y + totals!.height).toBeLessThanOrEqual(footerTop);
});

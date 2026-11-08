import { devices, expect, test } from "@playwright/test";

// Issue #39: タップ直後の互換マウスイベント mouseleave がホバー用の閉じるタイマーを仕掛け、ポップオーバーが約 0.25 秒で閉じていた
const { defaultBrowserType: _, ...iPhone } = devices["iPhone 13"];
test.use(iPhone);

test("スマホで本文の用語をタップするとポップオーバーが開いたまま残る", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/loans");
  const term = page.getByRole("region", { name: "ガイド" }).getByRole("button", { name: "貸付金・借入金" });
  await term.tap();
  await page.waitForTimeout(1000);
  await expect(term).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("dialog")).toBeVisible();
});

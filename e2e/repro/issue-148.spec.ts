import { expect, test } from "@playwright/test";

// スマホ幅の「使い方」は、画面に無い「左のガイド」「右の表」を指さない
test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

test("スマホ幅の使い方に、タブ表示で存在しない左右の配置を指す文言が出ない", async ({ page }) => {
  await page.goto("/units/depreciation/straight-line");
  await page.getByRole("button", { name: "使い方", exact: true }).first().click();
  const dialog = page.getByRole("dialog").last();
  for (const name of ["ガイド(読む)", "結果(見る)"]) await dialog.getByText(name).first().click();
  await expect(dialog).toContainText("貸借対照表と損益計算書");
  await expect(dialog).not.toContainText("左のガイド");
  await expect(dialog).not.toContainText("右の表");
});

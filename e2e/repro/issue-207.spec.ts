import { expect, test } from "@playwright/test";

// Issue #207: 「2年目」の単元の後に来る減価償却の単元が、時点を戻したことを示さずに1年目の話を始めていた
test("減価償却の単元の冒頭が、2年目の話の後でも時点の説明を持つ", async ({ page }) => {
  await page.goto("/units/depreciation/what-is-depreciation");
  const guide = page.getByRole("region", { name: "ガイド" });
  await expect(guide).toContainText("カフェ「マメノキ」を開いて1年");
  await expect(guide).toContainText(/時間を戻|別の場面|さかのぼ/);
});

import { expect, test } from "@playwright/test";

// Issue #74: プライバシーポリシーのページが無かった。フッターから開け、取得するもの・保存期間・問い合わせ先が書いてあること
test("フッターのリンクから/privacyが開き、必要な見出しがある", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "プライバシーポリシー" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { level: 1, name: "プライバシーポリシー" })).toBeVisible();
  for (const name of ["取得する情報", "保存期間", "問い合わせ先"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.getByText("90日")).toBeVisible();
});

test("会計IDEにはフッターを出さない(固定バーが入力欄に重ならないように)", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await expect(page.getByText("ステップ1 / 10")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
});

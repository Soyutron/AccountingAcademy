import { expect, test } from "@playwright/test";

// チュートリアル単元の「使い方」→「チュートリアルを最初から」で、使い方ダイアログが閉じてツアーが見えること
test("使い方からチュートリアルをやり直すとツアーが前面に出る", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  await page.evaluate(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true })));
  await page.reload();
  await page.getByRole("region", { name: "ガイド" }).waitFor();
  await page.getByRole("button", { name: "使い方" }).click();
  await page.getByRole("button", { name: "チュートリアルを最初から" }).click();
  await expect(page.getByRole("dialog", { name: /使い方/ })).toBeHidden();
  await expect(page.getByRole("dialog", { name: "チュートリアル" })).toBeVisible();
});

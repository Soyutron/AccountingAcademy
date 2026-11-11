import { expect, test } from "@playwright/test";

// Issue #32: notFound()と未マッチURLのどちらでも、日本語の案内と学習へ戻るリンクを出す
const urls = ["/units/nope/nope", "/topics/nope", "/paths/nope", "/units/cash-and-deposits", "/units/CASH-AND-DEPOSITS/checking-account"];

for (const url of urls) {
  test(`${url}の404が日本語の案内と戻る導線を出す`, async ({ page }) => {
    const res = await page.goto(url);
    expect(res?.status()).toBe(404);
    await expect(page.getByText("This page could not be found.")).toHaveCount(0);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
    await expect(main.getByRole("link", { name: "トップへ戻る" })).toHaveAttribute("href", "/");
  });
}

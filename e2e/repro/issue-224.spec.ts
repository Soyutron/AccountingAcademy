import { expect, test } from "@playwright/test";

// 初回バナーの「はじめる」からツアーをスキップしても、開いていた単元へ戻るリンクがガイドに出る

for (const [origin, title] of [
  ["/units/bookkeeping-basics/five-elements", "5つの要素と仕訳"],
  ["/units/merchandise/three-account-method", "仕入と売上"],
]) {
  test(`バナーから始めたツアーをスキップすると元の単元へ戻れる(${origin})`, async ({ page }) => {
    await page.goto(origin);
    await page.getByRole("note").getByRole("link", { name: "はじめる" }).click();
    const tour = page.getByRole("dialog", { name: "チュートリアル" });
    await expect(tour).toBeVisible();
    await tour.getByRole("button", { name: "スキップ" }).click();
    await expect(tour).toBeHidden();

    const back = page.getByRole("region", { name: "ガイド" }).getByRole("link", { name: `「${title}」へ戻る` });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(origin);
  });
}

test("チュートリアルを直接開いてスキップしたときは戻るリンクを出さない", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await tour.getByRole("button", { name: "スキップ" }).click();
  await expect(tour).toBeHidden();
  await expect(page.getByRole("link", { name: /^「.*」へ戻る$/ })).toHaveCount(0);
});

test("存在しない単元をfromに渡しても戻るリンクを出さない", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry?tour=1&from=https%3A%2F%2Fexample.com");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await tour.getByRole("button", { name: "スキップ" }).click();
  await expect(tour).toBeHidden();
  await expect(page.getByRole("link", { name: /^「.*」へ戻る$/ })).toHaveCount(0);
});

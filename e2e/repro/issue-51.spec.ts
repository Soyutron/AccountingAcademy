import { expect, test } from "@playwright/test";

const inTour = (page: import("@playwright/test").Page) =>
  page.evaluate(() => !!document.activeElement?.closest("[aria-label='チュートリアル']"));

// ツアーが開いた時と段が変わった時に、フォーカスがツアーへ移る
test("チュートリアルのツアーを開くとフォーカスが吹き出しへ移る", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await expect(tour).toBeVisible();
  await expect.poll(() => inTour(page)).toBe(true);

  await tour.getByRole("button", { name: "はじめる" }).click();
  await tour.getByRole("button", { name: "次へ" }).click();
  await expect(tour).toContainText("3 / 12");
  // 3/12はIDEの「次へ →」を押す段。ツアー内か指している「次へ →」にフォーカスがある
  await expect
    .poll(() =>
      page.evaluate(() => {
        const el = document.activeElement;
        return !!el?.closest("[aria-label='チュートリアル']") || el?.textContent?.trim() === "次へ →";
      }),
    )
    .toBe(true);
});

// 「使い方」ダイアログからやり直した時も、閉じたダイアログがフォーカスを「使い方」へ戻さずツアーに置く
test("使い方からチュートリアルをやり直すとフォーカスがツアーへ移る", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  await page.evaluate(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true })));
  await page.reload();
  await page.getByRole("region", { name: "ガイド" }).waitFor();
  await page.getByRole("button", { name: "使い方" }).click();
  await page.getByRole("button", { name: "チュートリアルを最初から" }).click();
  await expect(page.getByRole("dialog", { name: "チュートリアル" })).toBeVisible();
  await expect.poll(() => inTour(page)).toBe(true);
});

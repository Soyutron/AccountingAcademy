import { type Page, expect, test } from "@playwright/test";

// Issue #232: 累計額は資産ごとに分けた科目。コーヒーマシン(備品)の貸方に建物・車両の累計額を書くと正解になっていた

const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const next = async (page: Page, to: number) => {
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText(`ステップ${to} / 9`)).toBeVisible();
};
const post = async (page: Page, debit: string, credit: string, amount: number) => {
  await work(page).getByLabel("借方の科目1").fill(debit);
  await work(page).getByLabel("借方の金額1").fill(String(amount));
  await work(page).getByLabel("貸方の科目1").fill(credit);
  await work(page).getByLabel("貸方の金額1").fill(String(amount));
  await work(page).getByRole("button", { name: "記帳する" }).click();
};
const slide = async (page: Page, index: number, presses: number) => {
  const slider = work(page).getByRole("slider").nth(index);
  await slider.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < presses; i++) await page.keyboard.press("ArrowRight");
};
const toStep7 = async (page: Page) => {
  await page.goto("/units/depreciation/straight-line");
  await next(page, 2);
  await post(page, "車両運搬具", "現金", 1200000);
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
  await next(page, 3);
  await slide(page, 2, 5);
  await next(page, 4);
  await slide(page, 1, 6);
  await next(page, 5);
  await page.getByPlaceholder("金額(円)").fill("100000");
  await page.getByRole("button", { name: "確認する" }).click();
  await next(page, 6);
  for (const [label, value] of [["資産", "減る"], ["負債", "変わらない"], ["純資産", "減る"], ["収益", "変わらない"], ["費用", "増える"]]) {
    await work(page).getByLabel(`${label}の予想`, { exact: true }).selectOption({ label: value });
  }
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await next(page, 7);
};

for (const wrong of ["建物減価償却累計額", "車両運搬具減価償却累計額"]) {
  test(`コーヒーマシン(備品)の貸方に「${wrong}」と書くと正解にならない`, async ({ page }) => {
    await toStep7(page);
    await post(page, "減価償却費", wrong, 50000);
    await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "備品減価償却累計額に積みましょう" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "できました" })).toHaveCount(0);
  });
}

for (const right of ["備品減価償却累計額", "減価償却累計額"]) {
  test(`コーヒーマシン(備品)の貸方に「${right}」と書くと正解になる`, async ({ page }) => {
    await toStep7(page);
    await post(page, "減価償却費", right, 50000);
    await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
  });
}

test("減価償却とは何かの備品の減価償却で、建物の累計額は正解にならない", async ({ page }) => {
  await page.goto("/units/depreciation/what-is-depreciation");
  await next(page, 2);
  for (const [label, value] of [["資産", "減る"], ["負債", "変わらない"], ["純資産", "減る"], ["収益", "変わらない"], ["費用", "増える"]]) {
    await work(page).getByLabel(`${label}の予想`, { exact: true }).selectOption({ label: value });
  }
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await next(page, 3);
  await page.getByPlaceholder("金額(円)").fill("-260000");
  await page.getByRole("button", { name: "確認する" }).click();
  await next(page, 4);
  await next(page, 5);
  await post(page, "減価償却費", "建物減価償却累計額", 100000);
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toHaveCount(0);
});

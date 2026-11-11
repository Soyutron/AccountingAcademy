import { type Page, expect, test } from "@playwright/test";

// Issue #234: 定額法 ステップ5・6の誤答に汎用文だけが返っていた
const GENERIC = /計算の式と、使う数字をもう一度|予想と実際の動きが違いました/;
const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const next = async (page: Page, to: number) => {
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText(`ステップ${to} / 9`)).toBeVisible();
};
const slide = async (page: Page, index: number, presses: number) => {
  const slider = work(page).getByRole("slider").nth(index);
  await slider.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < presses; i++) await page.keyboard.press("ArrowRight");
};
const toStep5 = async (page: Page) => {
  await page.goto("/units/depreciation/straight-line");
  await next(page, 2);
  await work(page).getByLabel("借方の科目1").fill("車両運搬具");
  await work(page).getByLabel("借方の金額1").fill("1200000");
  await work(page).getByLabel("貸方の科目1").fill("現金");
  await work(page).getByLabel("貸方の金額1").fill("1200000");
  await work(page).getByRole("button", { name: "記帳する" }).click();
  await next(page, 3);
  await slide(page, 2, 5);
  await next(page, 4);
  await slide(page, 1, 6);
  await next(page, 5);
};
const expectExplained = async (page: Page) => {
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  await expect(status).not.toContainText(GENERIC);
};

for (const amount of ["83333", "116666", "116667", "1100000"]) {
  test(`初年度の減価償却費に${amount}と答えると、汎用文でない説明が返る`, async ({ page }) => {
    await toStep5(page);
    await page.getByPlaceholder("金額(円)").fill(amount);
    await page.getByRole("button", { name: "確認する" }).click();
    await expectExplained(page);
  });
}

test("減価償却の予想で「資産が増える」を選ぶと、累計額は資産のマイナスだと説明が返る", async ({ page }) => {
  await toStep5(page);
  await page.getByPlaceholder("金額(円)").fill("100000");
  await page.getByRole("button", { name: "確認する" }).click();
  await next(page, 6);
  for (const [label, value] of [["資産", "増える"], ["負債", "変わらない"], ["純資産", "減る"], ["収益", "変わらない"], ["費用", "増える"]]) {
    await work(page).getByLabel(`${label}の予想`, { exact: true }).selectOption({ label: value });
  }
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await expectExplained(page);
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toContainText("資産のマイナス");
});

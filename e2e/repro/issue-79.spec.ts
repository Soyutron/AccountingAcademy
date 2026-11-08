import { expect, test } from "@playwright/test";

// Issue #79: 読みや送り仮名の違いでも候補へたどり着ける。IME の変換中は赤字を出さない
const NOT_FOUND = /この名前の科目はありません|候補から選ぶか/;

const work = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "ワークスペース" });

async function openFirstJournal(page: import("@playwright/test").Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  const input = work(page).getByLabel("借方の科目 1");
  await input.click();
  return input;
}

for (const typed of ["仕入れ", "しいれ", "シイレ"]) {
  test(`「${typed}」と入れると候補に仕入が出る`, async ({ page }) => {
    const input = await openFirstJournal(page);
    await input.pressSequentially(typed);
    await expect(page.getByRole("option", { name: /^仕入/ })).toBeVisible();
    await expect(work(page).getByText(NOT_FOUND)).toHaveCount(0);
  });
}

test("送り仮名違いの「買い掛け金」は買掛金として認識される", async ({ page }) => {
  const input = await openFirstJournal(page);
  await input.pressSequentially("買い掛け金");
  await expect(page.getByRole("option", { name: /^買掛金/ })).toBeVisible();
  await expect(work(page).getByText(NOT_FOUND)).toHaveCount(0);
});

test("IME の変換中は科目が見つからないという赤字を出さない", async ({ page }) => {
  const input = await openFirstJournal(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.imeSetComposition", { text: "ぞぞ", selectionStart: 2, selectionEnd: 2 });
  await expect(input).toHaveValue("ぞぞ");
  await expect(work(page).getByText(NOT_FOUND)).toHaveCount(0);
});

test("IME の変換中の Enter は変換の確定に使い、候補を選ばない", async ({ page }) => {
  const input = await openFirstJournal(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.imeSetComposition", { text: "しい", selectionStart: 2, selectionEnd: 2 });
  await expect(page.getByRole("option", { name: /^仕入/ })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("しい");
});

test("確定した文字に合う科目が無ければ、次にすることを案内する", async ({ page }) => {
  const input = await openFirstJournal(page);
  await input.pressSequentially("ぞぞ");
  await expect(work(page).getByText("候補から選ぶか、漢字の一部を入れてください")).toBeVisible();
});

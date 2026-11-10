import { expect, test, type Page } from "@playwright/test";

// Issue #223: 箱に入れた後のフォーカスが箱に残り、次の科目へ毎回 Shift+Tab で戻っていた
const UNIT = "/units/bookkeeping-basics/five-elements";

const post = async (page: Page, debit: string, credit: string, amount: string) => {
  await page.getByLabel("借方の科目 1").fill(debit);
  await page.getByLabel("借方の金額 1").fill(amount);
  await page.getByLabel("貸方の科目 1").fill(credit);
  await page.getByLabel("貸方の金額 1").fill(amount);
  await page.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status").getByText("できました", { exact: true })).toBeVisible();
};

// 狭い画面ではガイドとワークスペースがタブで切り替わるので、ペインを開いてから操作する
async function openBoard(page: Page, mobile = false) {
  await page.goto(UNIT);
  const next = async () => {
    if (mobile) await page.getByRole("tab", { name: "ガイド" }).click();
    await page.getByRole("button", { name: "次へ →" }).click({ timeout: 15000 });
    if (mobile) await page.getByRole("tab", { name: "ワークスペース" }).click();
  };
  await next();
  await post(page, "現金", "資本金", "1000000");
  await next();
  for (const name of ["資産", "負債", "純資産", "収益", "費用"]) {
    await page.getByLabel(`${name}の予想`, { exact: true }).selectOption("none");
  }
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByRole("status").getByText("できました", { exact: true })).toBeVisible();
  await next();
  await post(page, "現金", "借入金", "300000");
  await next();
  await post(page, "現金", "売上", "80000");
  await next();
  await post(page, "支払家賃", "現金", "50000");
  await next();
  const board = page.getByRole("group", { name: "仕分けボード" });
  await expect(board).toBeVisible();
  return board;
}

const binButton = (label: string) => `${label} ← ここに入れる`;

test("Enter で箱に入れると残りの先頭の科目へフォーカスが移り、Shift+Tab なしで続けられる", async ({ page }) => {
  const board = await openBoard(page);
  await board.locator("[data-chip=cash]").focus();
  await page.keyboard.press("Enter");
  await board.getByRole("button", { name: binButton("資産"), exact: true }).focus();
  await page.keyboard.press("Enter");

  const equipment = board.locator("[data-chip=equipment]");
  await expect(equipment).toBeFocused();
  await expect(equipment).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("Enter");
  await expect(equipment).toHaveAttribute("aria-pressed", "true");
  const assetBin = board.getByRole("button", { name: binButton("資産"), exact: true });
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    if (await assetBin.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(assetBin).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(board.locator("[data-drop=asset] [data-chip=equipment]")).toBeVisible();
  await expect(board.locator("[data-drop=pool] [data-chip]").first()).toBeFocused();
});

test("最後の 1 件を Enter で入れても、フォーカスが body に落ちない", async ({ page }) => {
  const board = await openBoard(page);
  const chips = board.locator("[data-drop=pool] [data-chip]");
  const count = await chips.count();
  for (let i = 0; i < count; i++) {
    await chips.first().focus();
    await page.keyboard.press("Enter");
    await board.getByRole("button", { name: binButton("資産"), exact: true }).focus();
    await page.keyboard.press("Enter");
  }
  await expect(chips).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BUTTON");
});

test.describe("390px 幅のタップ", () => {
  test.use({ viewport: { width: 390, height: 480 }, hasTouch: true });

  test("箱をタップして入れても、ページがプールまで跳ねない", async ({ page }) => {
    const board = await openBoard(page, true);
    await board.locator("[data-chip=cash]").tap();
    const bin = board.getByRole("button", { name: binButton("費用"), exact: true });
    await bin.scrollIntoViewIfNeeded();
    const pool = board.locator("[data-drop=pool]");
    const before = (await pool.boundingBox())!.y;
    await bin.tap();
    await expect(board.locator("[data-drop=expense] [data-chip=cash]")).toBeVisible();
    expect((await pool.boundingBox())!.y).toBe(before);
  });
});

import { type Locator, type Page, expect, test } from "@playwright/test";

// Issue #251: 科目を選んだら、箱の見出しより下を押してもその箱に入る
const UNIT = "/units/bookkeeping-basics/five-elements";

const post = async (page: Page, debit: string, credit: string, amount: string) => {
  await page.getByLabel("借方の科目1").fill(debit);
  await page.getByLabel("借方の金額1").fill(amount);
  await page.getByLabel("貸方の科目1").fill(credit);
  await page.getByLabel("貸方の金額1").fill(amount);
  await page.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status").getByText("できました", { exact: true })).toBeVisible();
};

// 狭い画面ではガイドとワークスペースがタブで切り替わるので、ペインを開いてから操作する
async function openBoard(page: Page, mobile = false) {
  await page.goto(UNIT);
  const pane = async (name: string) => {
    if (mobile) await page.getByRole("tab", { name }).click();
  };
  const next = async () => {
    await pane("ガイド");
    await page.getByRole("button", { name: "次へ →" }).click({ timeout: 15000 });
    await pane("ワークスペース");
  };
  await next();
  await post(page, "現金", "資本金", "1000000");
  await next();
  for (const name of ["資産"]) {
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

const drop = (board: Locator, id: string) => board.locator(`[data-drop="${id}"]`);
const chipOf = (scope: Locator, name: string) => scope.getByRole("button", { name: new RegExp(`^${name}`) });

// 箱の下端からoffset px上の、見出しにもチップにも当たらない位置
async function lowerPoint(target: Locator, offset: number) {
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height - offset };
}

const expectPlaced = async (page: Page, board: Locator) => {
  await expect(chipOf(drop(board, "asset"), "備品")).toBeVisible();
  await expect(chipOf(drop(board, "pool"), "備品")).toHaveCount(0);
  await expect(page.getByRole("status").getByText("備品を資産に入れました", { exact: true })).toBeAttached();
};

test("PC幅のクリックでも、箱の見出しより下を押すと選んだ科目が入る", async ({ page }) => {
  const board = await openBoard(page);
  await chipOf(board, "備品").click();
  const point = await lowerPoint(drop(board, "asset"), 8);
  await page.mouse.click(point.x, point.y);
  await expectPlaced(page, board);
});

test("科目を選んでいないときに箱を押しても何も起きない", async ({ page }) => {
  const board = await openBoard(page);
  const point = await lowerPoint(drop(board, "asset"), 8);
  await page.mouse.click(point.x, point.y);
  await expect(page.getByRole("status").getByText("入れました")).toHaveCount(0);
  await expect(drop(board, "asset").locator("[data-chip]")).toHaveCount(0);
});

test("科目を選んだまま箱の中のチップを押すと、そのチップが候補へ戻るだけで選択中の科目は入らない", async ({ page }) => {
  const board = await openBoard(page);
  await chipOf(board, "現金").click();
  await drop(board, "asset").getByRole("button", { name: /ここに入れる/ }).click();
  await expect(chipOf(drop(board, "asset"), "現金")).toBeVisible();

  await chipOf(board, "備品").click();
  await chipOf(drop(board, "asset"), "現金").click();
  await expect(chipOf(drop(board, "pool"), "現金")).toBeVisible();
  await expect(chipOf(drop(board, "pool"), "備品")).toBeVisible();
  await expect(drop(board, "asset").locator("[data-chip]")).toHaveCount(0);
});

test("科目を選んだまま箱の中のチップをドラッグして同じ箱の余白で離しても、選択中の科目は入らない", async ({ page }) => {
  const board = await openBoard(page);
  await chipOf(board, "現金").click();
  await drop(board, "asset").getByRole("button", { name: /ここに入れる/ }).click();
  await expect(chipOf(drop(board, "asset"), "現金")).toBeVisible();

  await chipOf(board, "備品").click();
  const chip = (await chipOf(drop(board, "asset"), "現金").boundingBox())!;
  const point = await lowerPoint(drop(board, "asset"), 3);
  await page.mouse.move(chip.x + chip.width / 2, chip.y + chip.height / 2);
  await page.mouse.down();
  await page.mouse.move(chip.x + chip.width / 2 + 12, chip.y + chip.height / 2 + 4, { steps: 3 });
  await page.mouse.move(point.x, point.y, { steps: 5 });
  await page.mouse.up();

  await expect(page.locator("[data-drag-overlay]")).toHaveCount(0);
  await expect(chipOf(drop(board, "asset"), "現金")).toBeVisible();
  await expect(chipOf(drop(board, "pool"), "備品")).toBeVisible();
  await expect(chipOf(drop(board, "asset"), "備品")).toHaveCount(0);
});

test.describe("モバイル", () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

  test("科目をタップしてから箱の下端近くをタップすると、その箱に入る", async ({ page }) => {
    const board = await openBoard(page, true);
    await chipOf(board, "備品").tap();
    const point = await lowerPoint(drop(board, "asset"), 8);
    await page.touchscreen.tap(point.x, point.y);
    await expectPlaced(page, board);
  });
});

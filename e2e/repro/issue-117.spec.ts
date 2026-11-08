import { type Locator, type Page, devices, expect, test } from "@playwright/test";

// Issue #117: 仕分けボードはドラッグでも分類できる。クリックとキーボードの経路は残す
const UNIT = "/units/bookkeeping-basics/five-elements";
const ANSWER: [string, string][] = [["現金", "asset"], ["備品", "asset"], ["借入金", "liability"], ["資本金", "equity"], ["売上", "revenue"], ["支払家賃", "expense"]];

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

const center = async (target: Locator) => {
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};
const drop = (board: Locator, id: string) => board.locator(`[data-drop="${id}"]`);
const chipOf = (scope: Locator, name: string) => scope.getByRole("button", { name: new RegExp(`^${name}`) });

// dnd-kit は最初の移動で持ち上げるだけなので、dragTo の 1 回移動では落ちない。人の手と同じく刻んで動かす
async function hold(page: Page, board: Locator, name: string, to: string) {
  const from = await center(chipOf(board, name));
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 12, from.y + 12, { steps: 3 });
  const target = await drop(board, to).boundingBox();
  await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height - 6, { steps: 8 });
  await expect(drop(board, to)).toHaveAttribute("data-over", "true");
}
async function drag(page: Page, board: Locator, name: string, to: string) {
  await hold(page, board, name, to);
  await page.mouse.up();
  await expect(chipOf(drop(board, to), name)).toBeVisible();
  await expect(page.locator("[data-drag-overlay]")).toHaveCount(0);
}

test("候補から箱へ、箱から箱へ、箱から候補へドラッグで移せる", async ({ page }) => {
  const board = await openBoard(page);
  await drag(page, board, "現金", "asset");
  await expect(chipOf(drop(board, "pool"), "現金")).toHaveCount(0);
  await expect(page.getByRole("status").getByText("現金を資産に入れました", { exact: true })).toBeAttached();

  await drag(page, board, "現金", "liability");
  await expect(chipOf(drop(board, "asset"), "現金")).toHaveCount(0);

  await drag(page, board, "現金", "pool");
  await expect(chipOf(drop(board, "liability"), "現金")).toHaveCount(0);
  await expect(page.getByRole("status").getByText("現金を候補に戻しました", { exact: true })).toBeAttached();
});

test("ドラッグ中は乗っている箱だけが強調され、チップが追従し、箱の外で離すと元に戻る", async ({ page }) => {
  const board = await openBoard(page);
  await hold(page, board, "現金", "equity");
  await expect(board.locator("[data-over]")).toHaveCount(1);
  const overlay = page.locator("[data-drag-overlay]");
  await expect(overlay).toBeVisible();
  const pointer = await drop(board, "equity").boundingBox();
  const lifted = (await overlay.boundingBox())!;
  expect(Math.abs(lifted.y + lifted.height / 2 - (pointer!.y + pointer!.height - 6))).toBeLessThan(lifted.height);

  const heading = await center(page.getByRole("button", { name: "確認する" }));
  await page.mouse.move(heading.x, heading.y, { steps: 5 });
  await expect(board.locator("[data-over]")).toHaveCount(0);
  await page.mouse.up();
  await expect(chipOf(drop(board, "pool"), "現金")).toBeVisible();
});

test("全部ドラッグで入れて正解でき、間違いは正しい箱へドラッグで移すと赤枠が消える", async ({ page }) => {
  const board = await openBoard(page);
  await drag(page, board, "現金", "expense");
  for (const [name, el] of ANSWER.slice(1)) await drag(page, board, name, el);
  await page.getByRole("button", { name: "確認する" }).click();
  const status = page.getByRole("status");
  await expect(status.getByText("もう一歩")).toBeVisible();
  await expect(board.getByRole("button", { name: "現金 (間違い)" })).toBeVisible();

  await drag(page, board, "現金", "asset");
  await expect(board.getByText("(間違い)")).toHaveCount(0);
  await page.getByRole("button", { name: "確認する" }).click();
  await expect(status.getByText("できました", { exact: true })).toBeVisible();
  await expect(chipOf(board, "現金")).toBeDisabled();
});

test("クリックの経路とキーボードの経路が最後まで通り、クリックでも読み上げる", async ({ page }) => {
  const board = await openBoard(page);
  const bin = (el: string) => board.getByRole("button", { name: `${el} ← ここに入れる`, exact: true });
  await board.getByRole("button", { name: "現金", exact: true }).click();
  await bin("資産").click();
  await expect(chipOf(drop(board, "asset"), "現金")).toBeVisible();
  await expect(page.getByRole("status").getByText("現金を資産に入れました", { exact: true })).toBeAttached();

  const LABEL: Record<string, string> = { asset: "資産", liability: "負債", equity: "純資産", revenue: "収益", expense: "費用" };
  for (const [name, el] of ANSWER.slice(1)) {
    await board.getByRole("button", { name, exact: true }).focus();
    await page.keyboard.press("Enter");
    const target = bin(LABEL[el]);
    for (let i = 0; i < 20 && !(await target.evaluate((n) => n === document.activeElement)); i++) await page.keyboard.press("Tab");
    await expect(target).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(chipOf(drop(board, el), name)).toBeVisible();
  }
  await page.getByRole("button", { name: "確認する" }).click();
  await expect(page.getByRole("status").getByText("できました", { exact: true })).toBeVisible();
});

test("動きを減らす設定でもドラッグで入れられ、離すと持ち上げたチップがすぐ消える", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const board = await openBoard(page);
  await hold(page, board, "現金", "asset");
  await page.mouse.up();
  await expect(page.locator("[data-drag-overlay]")).toHaveCount(0, { timeout: 100 });
  await expect(chipOf(drop(board, "asset"), "現金")).toBeVisible();
});

test.describe("モバイル", () => {
  const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];
  test.use({ ...iPhone, viewport: { width: 390, height: 664 }, hasTouch: true });

  test("長押ししてからタッチのドラッグで箱に入れられる", async ({ page }) => {
    const board = await openBoard(page, true);
    const cdp = await page.context().newCDPSession(page);
    const from = await center(chipOf(board, "現金"));
    const target = await center(drop(board, "asset"));
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
    await page.waitForTimeout(350);
    for (let i = 1; i <= 8; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x + ((target.x - from.x) * i) / 8, y: from.y + ((target.y - from.y) * i) / 8 }] });
    }
    await expect(drop(board, "asset")).toHaveAttribute("data-over", "true");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(chipOf(drop(board, "asset"), "現金")).toBeVisible();
    await expect(chipOf(drop(board, "pool"), "現金")).toHaveCount(0);
  });
});

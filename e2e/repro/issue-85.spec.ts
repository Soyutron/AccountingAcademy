import { expect, test, type Page } from "@playwright/test";

// Issue #85: 押すとDOMから消えるボタンをEnterで押すと、移し先が無くフォーカスがbodyに落ちていた
const UNIT = "/units/bookkeeping-basics/five-elements";

const post = async (page: Page, debit: string, credit: string, amount: string) => {
  await page.getByLabel("借方の科目1").fill(debit);
  await page.getByLabel("借方の金額1").fill(amount);
  await page.getByLabel("貸方の科目1").fill(credit);
  await page.getByLabel("貸方の金額1").fill(amount);
  await page.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status").getByText("できました", { exact: true })).toBeVisible();
};

const predictAll = async (page: Page) => {
  for (const name of ["資産"]) {
    await page.getByLabel(`${name}の予想`, { exact: true }).selectOption("none");
  }
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByRole("status").getByText("できました", { exact: true })).toBeVisible();
};

test("「最新に戻る」はrangeへ、箱の中の科目はプールに戻った同じ科目へフォーカスを移す", async ({ page }) => {
  await page.goto(UNIT);
  const next = page.getByRole("button", { name: "次へ →" });
  await next.click();
  await post(page, "現金", "資本金", "1000000");
  await next.click();
  await predictAll(page);
  await next.click();
  await post(page, "現金", "借入金", "300000");

  const slider = page.getByRole("slider", { name: "帳簿をさかのぼる" });
  await slider.focus();
  await page.keyboard.press("ArrowLeft");
  const latest = page.getByRole("button", { name: "最新に戻る" });
  await latest.focus();
  await page.keyboard.press("Enter");
  await expect(latest).toHaveCount(0);
  await expect(slider).toBeFocused();

  await next.click();
  await post(page, "現金", "売上", "80000");
  await next.click();
  await post(page, "支払家賃", "現金", "50000");
  await next.click();

  const board = page.getByRole("group", { name: "仕分けボード" });
  const cash = board.getByRole("button", { name: /^現金/ });
  await cash.click();
  await board.getByRole("button", { name: /資産/ }).first().click();
  await cash.focus();
  await page.keyboard.press("Enter");
  await expect(cash).toBeFocused();
  await expect(cash).toHaveAttribute("aria-pressed", "true");

  // 戻した科目を選んだままTabで進むと、元の「資産」の箱を飛ばさずに届く
  const assetBin = board.getByRole("button", { name: "資産 ← ここに入れる", exact: true });
  const liabilityBin = board.getByRole("button", { name: "負債 ← ここに入れる", exact: true });
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    if (await assetBin.evaluate((el) => el === document.activeElement)) break;
    await expect(liabilityBin).not.toBeFocused();
  }
  await expect(assetBin).toBeFocused();
});

test("「今はしない」「続きから」はステップの見出しへ、「ヒントを見る」はヒント文へフォーカスを移す", async ({ page }) => {
  await page.goto(UNIT);
  const guide = page.getByRole("region", { name: "ガイド" });
  const heading = guide.getByRole("heading", { level: 2 });
  const dismiss = page.getByRole("button", { name: "今はしない" });
  await dismiss.focus();
  await page.keyboard.press("Enter");
  await expect(dismiss).toHaveCount(0);
  await expect(heading).toBeFocused();

  const next = page.getByRole("button", { name: "次へ →" });
  await next.click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  const hint = page.getByRole("button", { name: "ヒントを見る" });
  await hint.focus();
  await page.keyboard.press("Enter");
  await expect(hint).toHaveCount(0);
  await expect(guide.getByText(/^ヒント: /)).toBeFocused();

  await post(page, "現金", "資本金", "1000000");
  await next.click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  await page.waitForTimeout(1000);
  await page.reload();
  const resume = page.getByRole("button", { name: "続きから" });
  await resume.focus();
  await page.keyboard.press("Enter");
  await expect(resume).toHaveCount(0);
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  await expect(heading).toBeFocused();
});

test("「行を削除」は同じ位置の行へ、「わかった」はワークスペースへフォーカスを移す", async ({ page }) => {
  await page.goto(UNIT);
  const next = page.getByRole("button", { name: "次へ →" });
  await next.click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const addDebit = work.getByRole("button", { name: "行を追加" }).first();
  const removeButtons = work.locator('[data-journal-line^="debit-"]').getByRole("button", { name: "行を削除" });

  // 末尾の行を消すと、前の行(残った最後の行)へ移る
  await addDebit.click();
  await addDebit.click();
  await expect(removeButtons).toHaveCount(3);
  await removeButtons.nth(2).focus();
  await page.keyboard.press("Enter");
  await expect(removeButtons).toHaveCount(2);
  await expect(work.getByLabel("借方の科目2")).toBeFocused();

  // 残り1行になると「行を削除」が無効になるので、そこに留まらない
  await removeButtons.nth(0).focus();
  await page.keyboard.press("Enter");
  await expect(removeButtons).toHaveCount(1);
  await expect(work.getByLabel("借方の科目1")).toBeFocused();

  await post(page, "現金", "資本金", "1000000");
  await next.click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  const understood = page.getByRole("button", { name: "わかった" });
  await understood.focus();
  await page.keyboard.press("Enter");
  await expect(understood).toHaveCount(0);
  await expect(work).toBeFocused();
  // 続きのTabは、ページの先頭ではなくワークスペースの中へ進む
  await page.keyboard.press("Tab");
  expect(await work.evaluate((el) => el !== document.activeElement && el.contains(document.activeElement))).toBe(true);
});

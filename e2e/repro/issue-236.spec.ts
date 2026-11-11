import { expect, type Page, test } from "@playwright/test";

// Issue #236: 読みや漢字の一部で候補が1件に絞れても、欄を抜けると確定せず、その行の金額が合計に入らなかった
const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });

async function openFirstJournal(page: Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
}

async function typeInCredit(page: Page, text: string) {
  const credit = work(page).getByLabel("貸方の科目1");
  await credit.focus();
  await page.keyboard.type(text, { delay: 30 });
  return credit;
}

test("読みで候補が1件に絞れた科目欄をTabで抜けると、その候補に確定する", async ({ page }) => {
  await openFirstJournal(page);
  const credit = await typeInCredit(page, "しほんきん");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(work(page).getByLabel("貸方の金額1")).toBeFocused();
  await expect(credit).toHaveValue("資本金");
});

test("漢字の一部で候補が1件に絞れた科目欄をTabで抜けても確定する", async ({ page }) => {
  await openFirstJournal(page);
  const credit = await typeInCredit(page, "資本");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(credit).toHaveValue("資本金");
});

test("候補が1件の科目欄から金額欄をクリックして抜けても確定する", async ({ page }) => {
  await openFirstJournal(page);
  const credit = await typeInCredit(page, "しほんきん");
  await work(page).getByLabel("貸方の金額1").click();
  await expect(work(page).getByLabel("貸方の金額1")).toBeFocused();
  await expect(credit).toHaveValue("資本金");
});

test("キーボードだけで借方・貸方を入れると一致し、Tabで「記帳する」へ進める", async ({ page }) => {
  await openFirstJournal(page);
  await work(page).getByLabel("借方の科目1").focus();
  await page.keyboard.type("現金", { delay: 30 });
  await page.keyboard.press("Tab");
  await page.keyboard.type("300000");
  await page.keyboard.press("Tab");
  await expect(work(page).getByRole("button", { name: "行を追加" }).first()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(work(page).getByLabel("貸方の科目1")).toBeFocused();
  await page.keyboard.type("しほんきん", { delay: 30 });
  await page.keyboard.press("Tab");
  await page.keyboard.type("300000");
  await page.keyboard.press("Tab");

  await expect(work(page).getByText("借方合計300,000 / 貸方合計300,000 一致")).toBeVisible();
  await expect(work(page).getByText("科目を選んでください")).toHaveCount(0);
  // 「行を追加」と「記帳する」の間には「?」などがあるので、回数は決め打ちしない
  const post = work(page).getByRole("button", { name: "記帳する" });
  await expect(async () => {
    await page.keyboard.press("Tab");
    await expect(post).toBeFocused({ timeout: 100 });
  }).toPass({ timeout: 5000 });
});

test("候補が複数あるときはTabで抜けても先頭の候補を入れない", async ({ page }) => {
  await openFirstJournal(page);
  const credit = await typeInCredit(page, "きん");
  await expect.poll(() => page.getByRole("option").count()).toBeGreaterThan(1);
  await page.keyboard.press("Tab");
  await expect(credit).toHaveValue("きん");
});

test("候補が無い文字はTabで抜けてもそのまま残す", async ({ page }) => {
  await openFirstJournal(page);
  const credit = await typeInCredit(page, "ぞぞ");
  await expect(page.getByRole("option")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(credit).toHaveValue("ぞぞ");
});

test("空欄をTabで抜けても空のまま", async ({ page }) => {
  await openFirstJournal(page);
  const credit = work(page).getByLabel("貸方の科目1");
  await credit.focus();
  await page.keyboard.press("Tab");
  await expect(work(page).getByLabel("貸方の金額1")).toBeFocused();
  await expect(credit).toHaveValue("");
});

test("IMEの変換中に金額欄をクリックして抜けても、候補が1件なら確定する", async ({ page }) => {
  await openFirstJournal(page);
  const credit = work(page).getByLabel("貸方の科目1");
  await credit.click();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.imeSetComposition", { text: "しほんきん", selectionStart: 5, selectionEnd: 5 });
  await expect(credit).toHaveValue("しほんきん");
  await expect(page.getByRole("option")).toHaveCount(1);
  await work(page).getByLabel("貸方の金額1").click();
  await expect(credit).toHaveValue("資本金");
});

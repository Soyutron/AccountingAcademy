import { expect, test, type Page } from "@playwright/test";

// Issue #159: 空の科目欄を開いただけで先頭の「現金」が選択状態になり、Enter で選んでいない科目が入っていた。
// 矢印キー・文字入力・ホバーで候補を指したときだけ Enter で確定する

async function openFirstJournal(page: Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).waitFor();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  return page.getByRole("region", { name: "ワークスペース" }).getByLabel("借方の科目 1");
}

test("空の科目欄で Enter を押しても、選んでいない科目は入らない", async ({ page }) => {
  const account = await openFirstJournal(page);
  await account.click();
  await expect(account).toHaveAttribute("aria-expanded", "true");
  await expect(account).not.toHaveAttribute("aria-activedescendant", /.+/);
  await page.keyboard.press("Enter");
  await expect(account).toHaveValue("");
});

test("文字を消して空に戻した欄で Enter を押しても、科目は入らない", async ({ page }) => {
  const account = await openFirstJournal(page);
  await account.click();
  await account.pressSequentially("金");
  await account.press("Backspace");
  await expect(account).toHaveValue("");
  await expect(account).toHaveAttribute("aria-expanded", "true");
  await account.press("Enter");
  await expect(account).toHaveValue("");
});

test("入力済みの欄を開いただけで Enter を押しても、値は変わらず記帳もされない", async ({ page }) => {
  const account = await openFirstJournal(page);
  const work = page.getByRole("region", { name: "ワークスペース" });
  await account.fill("金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await account.click();
  await expect(account).toHaveAttribute("aria-expanded", "true");
  await account.press("Enter");
  await expect(account).toHaveValue("金");

  // 正解の仕訳が入っていても、候補が開いている間の Enter では記帳しない
  await account.fill("現金");
  await work.getByLabel("借方の金額 1").click();
  await account.click();
  await expect(account).toHaveAttribute("aria-expanded", "true");
  await account.press("Enter");
  await page.waitForTimeout(500);
  await expect(account).toHaveValue("現金");
  await expect(page.getByText("できました", { exact: true })).toHaveCount(0);
});

test("ArrowDown を 1 回押してから Enter を押すと先頭の候補が入る", async ({ page }) => {
  const account = await openFirstJournal(page);
  await account.click();
  await account.press("ArrowDown");
  await expect(account).toHaveAttribute("aria-activedescendant", /.+/);
  await account.press("Enter");
  await expect(account).toHaveValue("現金");
});

test("文字を入れて絞り込んだ後の Enter は先頭の候補を確定する", async ({ page }) => {
  const account = await openFirstJournal(page);
  await account.click();
  await account.pressSequentially("金");
  await account.press("Enter");
  await expect(account).toHaveValue("現金");
});

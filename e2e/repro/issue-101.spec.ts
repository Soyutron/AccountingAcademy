import { expect, test, type Page } from "@playwright/test";

// 「使い方」を閉じたら、開く操作をした要素へフォーカスを戻す

async function goToPost(page: Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
}

const helpDialog = (page: Page) => page.getByRole("dialog", { name: "会計 IDE の使い方" });

// Radix の Dialog は表示の数レンダー後に Esc のリスナーを登録するので、負荷が高いと表示直後の Esc が失われる
async function closeWithEscape(page: Page) {
  await expect(async () => {
    await page.keyboard.press("Escape");
    await expect(helpDialog(page)).toBeHidden({ timeout: 1000 });
  }).toPass();
}

test("「?」の「もっと詳しく」から開いた使い方を Esc で閉じると、押した「?」にフォーカスが戻る", async ({ page }) => {
  await goToPost(page);
  const icon = page.getByRole("button", { name: "「仕訳帳に書く」の説明" });
  await icon.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "もっと詳しく →" }).press("Enter");
  await expect(helpDialog(page)).toBeVisible();
  await closeWithEscape(page);
  await expect(icon).toBeFocused();
});

test("note の「くわしく」から開いた使い方を Esc で閉じると、「くわしく」にフォーカスが戻る", async ({ page }) => {
  await goToPost(page);
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const more = page.getByRole("note", { name: "初めての「予想して記帳する」" }).getByRole("button", { name: "くわしく" });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(helpDialog(page)).toBeVisible();
  await closeWithEscape(page);
  await expect(more).toBeFocused();
});

test("「?」から開いて閉じたあとでも、ヘッダーの「使い方」から開いて閉じるとヘッダーのボタンに戻る", async ({ page }) => {
  await goToPost(page);
  const icon = page.getByRole("button", { name: "「仕訳帳に書く」の説明" });
  await icon.click();
  await page.getByRole("button", { name: "もっと詳しく →" }).click();
  await expect(helpDialog(page)).toBeVisible();
  await closeWithEscape(page);
  await expect(icon).toBeFocused();

  const header = page.getByRole("button", { name: "使い方", exact: true });
  await header.click();
  await expect(helpDialog(page)).toBeVisible();
  await closeWithEscape(page);
  await expect(header).toBeFocused();
});

test("「場所を示す」で「?」が別のペインに隠れたら、ヘッダーの「使い方」にフォーカスが戻る", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await goToPost(page);
  await page.getByRole("tab", { name: "ワーク" }).click();
  await page.getByRole("button", { name: "「仕訳帳に書く」の説明" }).click();
  await page.getByRole("button", { name: "もっと詳しく →" }).click();
  const help = helpDialog(page);
  await expect(help).toBeVisible();
  await help.getByText("結果(見る)").click();
  await help.locator("#help-statements").getByRole("button", { name: "場所を示す" }).click();
  await expect(help).toBeHidden();
  await expect(page.getByRole("tab", { name: "結果" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "使い方", exact: true })).toBeFocused();
});

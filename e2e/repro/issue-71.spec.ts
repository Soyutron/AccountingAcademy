import { expect, test, type Page } from "@playwright/test";

// Issue #71: 片方だけ入った行・解決できない行を黙って捨てず、理由を出して記帳を止める
const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const postButton = (page: Page) => work(page).getByRole("button", { name: "記帳する" });
const secondDebit = (page: Page) => work(page).locator('[data-journal-line="debit-1"]');
const INCOMPLETE_HINT = "入力が途中の行があります。科目と金額をそろえるか、その行を削除すると記帳できます。";

async function fillBalancedWithSecondLine(page: Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await work(page).getByRole("button", { name: "行を追加" }).first().click();
  await work(page).getByLabel("借方の科目 1").fill("現金");
  await work(page).getByLabel("借方の金額 1").fill("1000000");
  await work(page).getByLabel("貸方の科目 1").fill("資本金");
  await work(page).getByLabel("貸方の金額 1").fill("1000000");
}

test("科目が空で金額だけの行があると記帳できず、行を消せば正解になる", async ({ page }) => {
  await fillBalancedWithSecondLine(page);
  await work(page).getByLabel("借方の金額 2").fill("500000");
  await expect(postButton(page)).toBeDisabled();
  await expect(secondDebit(page).getByText("科目を選んでください")).toBeVisible();
  await expect(postButton(page)).toHaveAccessibleDescription(INCOMPLETE_HINT);

  await secondDebit(page).getByRole("button", { name: "行を削除" }).click();
  await expect(postButton(page)).toBeEnabled();
  await postButton(page).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
});

test("科目だけで金額が空の行があると記帳できない", async ({ page }) => {
  await fillBalancedWithSecondLine(page);
  await work(page).getByLabel("借方の科目 2").fill("現金");
  await expect(postButton(page)).toBeDisabled();
  await expect(secondDebit(page).getByText("金額を入れてください")).toBeVisible();
});

for (const [name, reason] of [
  ["げんきん", "科目を選んでください"],
  ["ぜんぜん無い科目", "候補から選ぶか、漢字の一部を入れてください"],
]) {
  test(`確定していない科目「${name}」と金額の行があると記帳できない`, async ({ page }) => {
    await fillBalancedWithSecondLine(page);
    await work(page).getByLabel("借方の科目 2").fill(name);
    await work(page).getByLabel("借方の金額 2").fill("500000");
    await expect(postButton(page)).toBeDisabled();
    await expect(secondDebit(page).getByText(reason)).toBeVisible();
  });
}

test("0 円の行があると記帳できない", async ({ page }) => {
  await fillBalancedWithSecondLine(page);
  await work(page).getByLabel("借方の科目 2").fill("現金");
  await work(page).getByLabel("借方の金額 2").fill("0");
  await expect(postButton(page)).toBeDisabled();
  await expect(secondDebit(page).getByText("1 円以上の金額を入れてください")).toBeVisible();
});

test("何も入れていない行は無視して記帳できる", async ({ page }) => {
  await fillBalancedWithSecondLine(page);
  await expect(postButton(page)).toBeEnabled();
  await postButton(page).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
});

test("途中の行があっても「← 前へ」は入力が消えることを確認する", async ({ page }) => {
  await fillBalancedWithSecondLine(page);
  await work(page).getByLabel("借方の金額 2").fill("500000");
  let confirmed = false;
  page.once("dialog", (dialog) => {
    confirmed = true;
    void dialog.dismiss();
  });
  await page.getByRole("button", { name: "← 前へ" }).click();
  await expect.poll(() => confirmed).toBe(true);
  await expect(work(page).getByLabel("借方の金額 2")).toHaveValue("500,000");
});

test("自由に試すでも、途中の行があると記帳できない", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  await page.getByRole("dialog", { name: "チュートリアル" }).getByRole("button", { name: "スキップ" }).click();
  const next = page.getByRole("button", { name: "次へ →" });
  await next.click();
  const fill = async () => {
    await work(page).getByLabel("借方の科目 1").fill("現金");
    await work(page).getByLabel("借方の金額 1").fill("100000");
    await work(page).getByLabel("貸方の科目 1").fill("資本金");
    await work(page).getByLabel("貸方の金額 1").fill("100000");
  };
  await fill();
  await postButton(page).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await next.click();
  await expect(page.getByText("ステップ 4 / 4")).toBeVisible();

  await fill();
  await work(page).getByRole("button", { name: "行を追加" }).first().click();
  await work(page).getByLabel("借方の金額 2").fill("500000");
  await expect(postButton(page)).toBeDisabled();
  await expect(postButton(page)).toHaveAccessibleDescription(INCOMPLETE_HINT);

  await secondDebit(page).getByRole("button", { name: "行を削除" }).click();
  await expect(postButton(page)).toBeEnabled();
});

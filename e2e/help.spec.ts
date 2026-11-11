import { expect, test } from "@playwright/test";

// 機能横の「?」と、分類ごとに畳んだ「使い方」(docs/help-design.md)

test("「使い方」はいまの画面の機能を先に出し、残りは分類ごとに畳む", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  await page.evaluate(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true })));
  await page.reload();
  await page.getByRole("button", { name: "次へ →" }).click(); // 記帳するステップへ
  await page.getByRole("button", { name: "使い方" }).click();
  const help = page.getByRole("dialog", { name: "会計IDEの使い方" });
  const now = help.getByRole("region", { name: "いまの画面でできること" });
  await expect(now).toContainText("ステップ2");
  await expect(now.locator("dt")).toHaveText(["ヒントと答え", "仕訳帳に書く", "影響の表示"]);
  // 分類は畳まれていて、開くと中身が見える
  const result = help.locator("details").filter({ hasText: "結果(見る)" });
  await expect(result.locator("dt").first()).toBeHidden();
  await result.locator("summary").click();
  await expect(result.locator("dt").filter({ hasText: "帳簿をさかのぼる" })).toBeVisible();
  // 設定は末尾に残る
  await expect(help.getByRole("button", { name: "チュートリアルを最初から" })).toBeVisible();
  await expect(help.getByRole("checkbox")).toBeChecked();
});

test("見出し横の「?」でその機能だけの説明が読め、「もっと詳しく」でその話題が開く", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  await page.evaluate(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true })));
  await page.reload();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByRole("button", { name: "「仕訳帳に書く」の説明" }).click();
  const pop = page.getByRole("dialog", { name: "仕訳帳に書く" });
  await expect(pop).toContainText("科目と金額を入れて");
  // Escで閉じてフォーカスが「?」に戻る
  await page.keyboard.press("Escape");
  await expect(pop).toBeHidden();
  await expect(work.getByRole("button", { name: "「仕訳帳に書く」の説明" })).toBeFocused();
  await work.getByRole("button", { name: "「影響の表示」の説明" }).click();
  await page.getByRole("button", { name: "もっと詳しく" }).click();
  const help = page.getByRole("dialog", { name: "会計IDEの使い方" });
  await expect(help).toBeVisible();
  await expect(help.locator("#help-impact")).toBeFocused();
  await expect(help.locator("#help-impact")).toBeInViewport();
  await expect(help.locator("#help-impact dd")).toBeVisible();
});

test("ツアー中は「?」を出さない", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  await expect(page.getByRole("dialog", { name: "チュートリアル" })).toBeVisible();
  await expect(page.getByRole("button", { name: /」の説明$/ })).toHaveCount(0);
});

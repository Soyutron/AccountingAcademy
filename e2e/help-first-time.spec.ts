import { expect, test, type Page } from "@playwright/test";

// 初めて出る課題の種類の案内と、「使い方」の「場所を示す」(docs/help-design.md 5.2 / 5.3)

// 5つの要素と仕訳: ステップ2(post)を解いてステップ3(predict)へ
async function goToPredict(page: Page) {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "今はしない" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
}

const seen = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem("tutorial-state") ?? "{}").seen ?? []) as string[]);

test("predictが初めて出たとき案内が出て、「わかった」で閉じると二度と出ない", async ({ page }) => {
  await goToPredict(page);
  const note = page.getByRole("note", { name: "初めての「予想して記帳する」" });
  await expect(note).toBeVisible();
  await expect(note).toContainText("5要素がどう動くかを選びます");
  await note.getByRole("button", { name: "わかった" }).click();
  await expect(note).toBeHidden();
  expect(await seen(page)).toContain("predict");
  // 同じステップを開き直しても出ない
  await page.reload();
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByRole("combobox", { name: "資産の予想", exact: true })).toBeVisible();
  await expect(page.getByRole("note", { name: /初めての/ })).toHaveCount(0);
});

test("案内を閉じずに課題を済ませても見た扱いになり、「くわしく」は使い方の該当話題を開く", async ({ page }) => {
  await goToPredict(page);
  const note = page.getByRole("note", { name: "初めての「予想して記帳する」" });
  await note.getByRole("button", { name: "くわしく" }).click();
  const help = page.getByRole("dialog", { name: "会計IDEの使い方" });
  await expect(help.locator("#help-predict")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(help).toBeHidden();
  await expect(note).toBeVisible();
  for (const el of ["資産", "負債", "純資産", "収益", "費用"]) await page.getByRole("combobox", { name: `${el}の予想`, exact: true }).selectOption("increase");
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(note).toBeHidden();
  expect(await seen(page)).toContain("predict");
});

test("チュートリアル単元では案内を出さない", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  await expect(page.getByRole("dialog", { name: "チュートリアル" })).toBeVisible();
  await expect(page.getByRole("note", { name: /初めての/ })).toHaveCount(0);
});

test("「使い方」の「場所を示す」で対象が光り、Escで消える", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  await page.evaluate(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true })));
  await page.reload();
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByRole("button", { name: "使い方" }).click();
  const help = page.getByRole("dialog", { name: "会計IDEの使い方" });
  const now = help.getByRole("region", { name: "いまの画面でできること" });
  // 画面に出ていない機能(帳簿をさかのぼる)には付かない
  await help.getByText("結果(見る)").click();
  await expect(help.locator("#help-rewind").getByRole("button", { name: "場所を示す" })).toHaveCount(0);
  await now.locator("#now-journal").getByRole("button", { name: "場所を示す" }).click();
  await expect(help).toBeHidden();
  const spot = page.locator("[data-spotlight='journal']");
  await expect(spot).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(spot).toBeHidden();
});

test("スマホ幅の「場所を示す」は対象のペインへ切り替える", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/units/tutorial/first-entry");
  await page.evaluate(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true })));
  await page.reload();
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByRole("button", { name: "使い方" }).click();
  const help = page.getByRole("dialog", { name: "会計IDEの使い方" });
  await help.getByText("結果(見る)").click();
  await help.locator("#help-statements").getByRole("button", { name: "場所を示す" }).click();
  await expect(page.getByRole("tab", { name: "結果" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("[data-spotlight='statements']")).toBeVisible();
});

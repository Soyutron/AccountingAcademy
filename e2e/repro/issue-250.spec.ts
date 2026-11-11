import { expect, test } from "@playwright/test";

// スマホ幅のツアーで学習者が別のタブへ移っても、カードが案内先のペインへ戻る道を示す

test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

test("ツアーの記入の段で別のペインへ移ると、案内先へ戻れる案内がある", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const card = page.getByRole("dialog", { name: "チュートリアル" });
  await card.getByRole("button", { name: /はじめる|次へ/ }).first().click();
  await card.getByRole("button", { name: /次へ/ }).first().click();
  await expect(card).toContainText("3 / 12");
  await page.locator("button", { hasText: "次へ →" }).last().click({ force: true });
  await expect(card).toContainText("4 / 12");

  const tabs = page.getByRole("tablist", { name: "ペインの切り替え" });
  await expect(tabs.getByRole("tab", { selected: true })).toHaveText("ワークスペース");
  await tabs.getByRole("tab", { name: "結果" }).click();

  // 学習者のタップは打ち消さず、カードで戻り方を示す
  await expect(tabs.getByRole("tab", { selected: true })).toHaveText("結果");
  await expect(card).toContainText("「ワークスペース」のタブに戻ると続けられます");
  await card.getByRole("button", { name: "ワークスペースに戻る" }).click();

  await expect(tabs.getByRole("tab", { selected: true })).toHaveText("ワークスペース");
  await expect(card).not.toContainText("タブに戻ると続けられます");
  await page.getByLabel("借方の科目 1").fill("現金");
  await page.getByLabel("借方の金額 1").fill("100000");
  await card.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(card).toContainText("5 / 12");
});

test("PC 幅では 3 ペインが並ぶので戻る案内を出さない", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/units/tutorial/first-entry?tour=1");
  const card = page.getByRole("dialog", { name: "チュートリアル" });
  await card.getByRole("button", { name: "はじめる" }).click();
  await card.getByRole("button", { name: "次へ", exact: true }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(card).toContainText("4 / 12");
  await expect(card).not.toContainText("タブに戻ると続けられます");
});

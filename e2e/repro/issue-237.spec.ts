import { expect, test } from "@playwright/test";

// ステップ本文の長さは単元ごとに違うので、「使い方」とツアーは文の数を約束しない

const COUNT_CLAIM = /2〜4\s?文/;

test("「使い方」のガイドの読み方が、ステップの文の数を約束しない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "使い方" }).first().click();
  const help = page.getByRole("dialog").last();
  await help.locator("summary").first().click();
  await expect(help).toContainText("すぐ手を動かします");
  expect(await help.innerText()).not.toMatch(COUNT_CLAIM);
});

test("ツアー 2/12 のガイドのカードが、ステップの文の数を約束しない", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const card = page.getByRole("dialog", { name: "チュートリアル" });
  await card.getByRole("button", { name: "はじめる" }).click();
  await expect(card).toContainText("2 / 12");
  await expect(card).toContainText("ここはガイド");
  expect(await card.innerText()).not.toMatch(COUNT_CLAIM);
});

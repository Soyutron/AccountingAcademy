import { expect, test } from "@playwright/test";

// Issue #155: 帳簿が当座預金を減らす時点と、銀行の残高が減る時点の違いが説明されていなかった
test("小切手で払う ステップ3: 帳簿は振り出した日に減らし、銀行の残高は持ち込まれたときに減ると書く", async ({ page }) => {
  await page.goto("/units/cash-and-deposits/checking-account");
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await expect(page.getByText("ステップ2 /")).toBeVisible();

  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("当座預金");
  await work.getByLabel("借方の金額1").fill("200000");
  await work.getByLabel("貸方の科目1").fill("普通預金");
  await work.getByLabel("貸方の金額1").fill("200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await expect(page.getByText("ステップ3 /")).toBeVisible();

  const guide = page.getByRole("region", { name: "ガイド" });
  await expect(guide).toContainText("帳簿では");
  await expect(guide).toContainText("振り出した日");
  await expect(guide).toContainText("銀行の残高");
  await expect(guide).toContainText("持ち込");
});

test("用語「小切手」: 帳簿が減らす時点と銀行の残高が減る時点を分けて書く", async ({ page }) => {
  await page.goto("/glossary#check");
  const entry = page.locator("[id='check']");
  await expect(entry).toBeVisible();
  await expect(entry).toContainText("振り出した時点で帳簿の当座預金を減らす");
  await expect(entry).toContainText("銀行の残高");
  await expect(entry).not.toContainText("小切手を渡すと、当座預金が25,000円減る");
});

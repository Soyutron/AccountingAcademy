import { expect, test } from "@playwright/test";

// Issue #160: 「自由に試す」の記帳は保存されず再読み込みで消える。そのことを見出しの下と「使い方」に書く

test("「自由に試す」の見出しの下と「使い方」に、記帳が保存されないことが書いてある", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  await page.getByRole("button", { name: "スキップ" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByRole("button", { name: "記帳する", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "できました" }).first()).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ4 / 4")).toBeVisible();

  const notice = "再読み込みすると消えます";
  await expect(work.locator('[data-tour="task-sandbox"]')).toContainText(notice);

  await page.getByRole("button", { name: "使い方" }).click();
  const help = page.getByRole("dialog", { name: "会計IDEの使い方" });
  await expect(help).toContainText(`採点はありません。ここで記帳した仕訳はこのページを開いている間だけ残り、${notice}`);
});

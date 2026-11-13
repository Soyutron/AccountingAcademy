import { expect, test } from "@playwright/test";

// Issue #25: 押したボタンが消える「もっと見る」「記帳する」「予想して記帳する」で、フォーカスがbodyに落ちていた
test("もっと見る・記帳する・予想して記帳するをEnterで押しても、フォーカスが近くの要素に移る", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const guide = page.getByRole("region", { name: "ガイド" });
  await guide.getByRole("button", { name: "取引" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "もっと見る" })).toBeFocused();
  await page.keyboard.press("Enter");
  // 展開した説明(ポップオーバーの中)にフォーカスがある
  await expect(page.getByRole("button", { name: "もっと見る" })).toHaveCount(0);
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("[data-radix-popper-content-wrapper]")))).toBe(true);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).focus();
  await page.keyboard.press("Enter");
  const status = page.getByRole("status").filter({ hasText: "できました" });
  await expect(status).toBeVisible();
  await expect(status).toBeFocused();

  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  for (const el of ["資産"]) await work.getByLabel(`${el}の予想`, { exact: true }).selectOption("none");
  await work.getByRole("button", { name: "予想して記帳する" }).focus();
  await page.keyboard.press("Enter");
  await expect(work.getByRole("button", { name: "予想して記帳する" })).toHaveCount(0);
  await expect(page.getByRole("status")).toBeFocused();
});

import { expect, test } from "@playwright/test";

// Issue #138: 比較表の「期待される動き」で、一致した行だけ数値の代わりに「同じ」と出て、動かないという意味に読めた
test("比較表の「期待される動き」は、全行を同じ表記の期待値で示す", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByText("今はしない").click();
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const field = async (label: string, value: string) => {
    await work.getByLabel(label).fill(value);
    await page.keyboard.press("Escape");
  };
  await field("借方の科目 1", "現金");
  await field("借方の金額 1", "1000000");
  await field("貸方の科目 1", "借入金");
  await field("貸方の金額 1", "1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const box = page.getByRole("status").filter({ hasText: "もう一歩" });
  // 資産・負債・純資産・収益・費用の順
  await expect(box.locator("tbody tr td:last-child")).toHaveText(["+1,000,000", "±0", "+1,000,000", "±0", "±0"]);
  // ずれた行(負債と純資産)だけが強調される
  await expect(box.locator("tbody tr.text-diff-fg")).toHaveCount(2);
});

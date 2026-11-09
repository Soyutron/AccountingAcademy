import { expect, test } from "@playwright/test";

// Issue #118: 正解の直後に「次へ →」で進むと、祝福の札「次へ →で進めます」が次のステップの上に残っていた
test("「次へ →」で進むと祝福の札が消え、次の正解でも札は 1 枚だけ", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const next = page.getByRole("button", { name: "次へ →" });
  await next.click({ timeout: 15000 });
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("1000000");
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("1000000");
  await page.getByRole("button", { name: "記帳する" }).click();
  const done = page.getByRole("status").getByText("できました", { exact: true });
  await expect(done).toBeVisible();
  const card = page.locator("[data-celebration]").getByText("次のステップへ進めます");
  await expect(card).toHaveCount(1);

  await next.click();
  await expect(page.getByText("ステップ 3 / 10")).toBeVisible();
  await expect(card).toHaveCount(0, { timeout: 500 });

  for (const n of ["資産", "負債", "純資産", "収益", "費用"]) await page.getByLabel(`${n}の予想`, { exact: true }).selectOption({ label: "変わらない" });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(done).toBeVisible();
  await expect(card).toHaveCount(1);
});

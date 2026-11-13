import { expect, test } from "@playwright/test";

// Issue #124: 3か月目の当期純利益を、掛けの代金が動く前に問い、支払家賃は経過した2か月分を積む
test("掛け売上の直後の計算問題で、売掛金と買掛金が残り、支払家賃は100,000で、お金の動きだけの誤答に誤解の説明が出る", async ({ page }) => {
  await page.goto("/units/merchandise/credit-transactions");
  await page.getByRole("button", { name: "今はしない" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const status = page.getByRole("status");
  const next = page.getByRole("button", { name: "次へ →" });
  const result = page.getByRole("region", { name: "結果" });
  const pl = result.locator("section", { hasText: "損益計算書" }).last();
  const bs = result.locator("section", { hasText: "貸借対照表" }).last();

  await next.click();
  await work.getByLabel("借方の科目1").fill("仕入");
  await work.getByLabel("借方の金額1").fill("40000");
  await work.getByLabel("貸方の科目1").fill("買掛金");
  await work.getByLabel("貸方の金額1").fill("40000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(status.getByText("できました")).toBeVisible();

  await next.click();
  for (const [el, v] of [["資産", "increase"], ["負債", "none"], ["純資産", "increase"], ["収益", "increase"], ["費用", "none"]])
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(status.getByText("できました")).toBeVisible();

  await next.click();
  await expect(page.getByText("ステップ4 / 8")).toBeVisible();
  await expect(work.getByPlaceholder("金額(円)")).toBeVisible();
  await expect(bs).toContainText(/売掛金\s*60,000/);
  await expect(bs).toContainText(/買掛金\s*40,000/);
  await expect(pl).toContainText(/支払家賃\s*100,000/);
  await expect(pl).toContainText(/当期純利益\s*40,000/);

  await work.getByPlaceholder("金額(円)").fill("20000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(status).toContainText("お金を受け取るまで売上ではない");

  await work.getByPlaceholder("金額(円)").fill("40000");
  await work.getByRole("button", { name: "確認する" }).click();
  await expect(status.getByText("できました")).toBeVisible();
});

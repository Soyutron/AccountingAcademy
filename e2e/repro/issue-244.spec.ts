import { expect, test } from "@playwright/test";

// Issue #244: 残高0のT勘定に「借方」と付いていた(0にはどちらの側もない)
test("残高0の負債のT勘定に側が付かず、0でない科目には側が残る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" }).first();
  const post = async (d: string, c: string, amt: number) => {
    await work.getByLabel("借方の科目1").fill(d);
    await work.getByLabel("借方の金額1").fill(String(amt));
    await work.getByLabel("貸方の科目1").fill(c);
    await work.getByLabel("貸方の金額1").fill(String(amt));
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
  };
  await page.goto("/units/merchandise/credit-transactions");
  await page.getByRole("button", { name: "今はしない" }).click({ timeout: 8000 }).catch(() => {});
  await next.click();
  await post("仕入", "買掛金", 40000);
  await next.click();
  await expect(page.getByText("ステップ3 / 8")).toBeVisible();
  for (const b of await page.getByRole("button", { name: "わかった" }).all()) await b.click().catch(() => {});
  for (const [k, v] of Object.entries({ 資産: "増える", 負債: "変わらない", 純資産: "増える", 収益: "増える", 費用: "変わらない" }))
    await work.getByLabel(`${k}の予想`, { exact: true }).selectOption({ label: v });
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await post("普通預金", "売掛金", 60000);
  await next.click();
  await post("買掛金", "現金", 40000);
  await work.getByText("総勘定元帳(T勘定)").click();

  const card = work.locator("div.text-sm").filter({ hasText: /^\S?\s*買掛金借方/ });
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("残高0");
  await expect(card).not.toContainText("残高0(借方)");
  await expect(card).not.toContainText("残高0(貸方)");
  // 0でない残高には側が残る
  await expect(work).toContainText("残高300,000(貸方)");
});

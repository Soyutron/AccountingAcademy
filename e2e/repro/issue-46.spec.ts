import { expect, test } from "@playwright/test";

// 当期純損失の行で、損失が減ったら「減少」、増えたら「増加」と読めること
test("当期純損失の増減バッジが損失の増減と同じ向き", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/loans");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const bs = page.getByRole("region", { name: "結果" }).locator("section[aria-label='貸借対照表']");
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("貸付金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("普通預金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 9")).toBeVisible();
  const pick = { 資産: "increase", 負債: "none", 純資産: "increase", 収益: "increase", 費用: "none" };
  for (const [el, v] of Object.entries(pick)) await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  // 損失10,500 → 8,500
  const lossRow = bs.locator("div").filter({ hasText: /^当期純損失/ }).last();
  await expect(lossRow).toContainText("8,500");
  await expect(lossRow).toContainText("減少");
  await expect(lossRow).not.toContainText("増加");

  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("支払利息");
  await work.getByLabel("借方の金額1").fill("3000");
  await work.getByLabel("貸方の科目1").fill("普通預金");
  await work.getByLabel("貸方の金額1").fill("3000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  // 損失8,500 → 11,500
  await expect(lossRow).toContainText("11,500");
  await expect(lossRow).toContainText("増加");
  await expect(lossRow).not.toContainText("減少");
});

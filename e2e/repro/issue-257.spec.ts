import { expect, test } from "@playwright/test";

// Issue #257: 資産だけの仕訳を貸借逆にしても「よくある思い込み」が出なかった
test("貸付の仕訳を貸借逆にすると誤解の説明が出る(貸したお金、借りたお金 ステップ2)", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true })));
  await page.goto("/units/receivables-and-payables/loans");
  await page.getByRole("button", { name: "次へ →" }).first().click();
  await expect(page.getByText("ステップ2 / 9")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("普通預金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("貸付金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const status = page.getByRole("status");
  await expect(status).toContainText("もう一歩");
  await expect(status).toContainText("よくある思い込み: お金が出ていく側を左に書く");
});

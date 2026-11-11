import { expect, test } from "@playwright/test";

test("元手の出資を「現金 / 借入金」と書くと、資本金と借入金の違いを説明する", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("借入金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  const status = page.getByRole("status");
  await expect(status).toContainText("もう一歩");
  await expect(status).not.toContainText("まだ合っていません");
  await expect(status).toContainText("返す義務");
  await expect(status).toContainText("よくある思い込み: 元手と借入金の混同");
});

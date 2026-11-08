import { type Page, expect, test } from "@playwright/test";

// 掛けで売る、掛けで買う のステップ 4(代金が普通預金に振り込まれる)まで正解で進める
async function openDepositStep(page: Page) {
  await page.goto("/units/merchandise/credit-transactions");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = () => page.getByRole("button", { name: "次へ →" }).click();
  const ok = () => expect(page.getByRole("status").getByText("できました")).toBeVisible();
  await next();
  await work.getByLabel("借方の科目 1").fill("仕入");
  await work.getByLabel("借方の金額 1").fill("40000");
  await work.getByLabel("貸方の科目 1").fill("買掛金");
  await work.getByLabel("貸方の金額 1").fill("40000");
  await page.getByRole("button", { name: "記帳する" }).click();
  await ok();
  await next();
  const pred: Record<string, string> = { 資産: "増える", 負債: "変わらない", 純資産: "増える", 収益: "増える", 費用: "変わらない" };
  for (const [el, v] of Object.entries(pred)) await work.getByLabel(`${el}の予想`, { exact: true }).selectOption({ label: v });
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await ok();
  await next();
  return work;
}

test("普通預金に振り込まれた取引を現金で記帳すると正解にならない", async ({ page }) => {
  const work = await openDepositStep(page);
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("60000");
  await work.getByLabel("貸方の科目 1").fill("売掛金");
  await work.getByLabel("貸方の金額 1").fill("60000");
  await page.getByRole("button", { name: "記帳する" }).click();
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  await expect(status).toContainText("普通預金");
});

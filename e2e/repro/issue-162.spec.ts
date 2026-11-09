import { expect, test } from "@playwright/test";

// 正しい行に余計な行を足した仕訳に、その行だけを見た誤解が付いていた(貸したお金、借りたお金 ステップ 6)
test("貸付金を正しく減らし受取利息も足した仕訳に「受取利息ではなく貸付金を減らします」と出さない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const fill = async (label: string, value: string) => work.getByLabel(label, { exact: true }).fill(value);
  const post = () => work.getByRole("button", { name: /^(予想して)?記帳する$/ }).click();
  const ok = () => expect(page.getByText("できました", { exact: true })).toBeVisible();

  await page.goto("/units/receivables-and-payables/loans");
  await next.click();
  await fill("借方の科目 1", "貸付金");
  await fill("借方の金額 1", "100000");
  await fill("貸方の科目 1", "普通預金");
  await fill("貸方の金額 1", "100000");
  await post();
  await ok();
  await next.click();
  for (const [label, value] of [["資産の予想", "増える"], ["負債の予想", "変わらない"], ["純資産の予想", "増える"], ["収益の予想", "増える"], ["費用の予想", "変わらない"]]) {
    await work.getByLabel(label, { exact: true }).selectOption({ label: value });
  }
  await post();
  await ok();
  await next.click();
  await fill("借方の科目 1", "支払利息");
  await fill("借方の金額 1", "3000");
  await fill("貸方の科目 1", "普通預金");
  await fill("貸方の金額 1", "3000");
  await post();
  await ok();
  await next.click();
  await work.getByPlaceholder("金額(円)").fill("3000");
  await work.getByRole("button", { name: "確認する" }).click();
  await ok();
  await next.click();
  await expect(page.getByText("ステップ 6 / 9")).toBeVisible();

  await fill("借方の科目 1", "普通預金");
  await fill("借方の金額 1", "102000");
  await fill("貸方の科目 1", "貸付金");
  await fill("貸方の金額 1", "100000");
  await work.getByRole("button", { name: "行を追加" }).nth(1).click();
  await fill("貸方の科目 2", "受取利息");
  await fill("貸方の金額 2", "2000");
  await post();

  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  await expect(status).not.toContainText("受取利息ではなく貸付金を減らします");
  await expect(status).toContainText("別の入金");
});

import { expect, test, type Page } from "@playwright/test";

// Issue #267: 入金100,000を貸付金98,000と受取利息2,000に分けると、「受取利息ではなく貸付金を減らします」と出ていた(貸したお金、借りたお金 ステップ6)

const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const next = (page: Page) => page.getByRole("button", { name: "次へ →" }).click();
async function post(page: Page, debit: [string, string][], credit: [string, string][], expectOk = true) {
  const w = work(page);
  for (const [side, lines] of [["借方", debit], ["貸方", credit]] as const) {
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) await w.getByRole("button", { name: "行を追加" }).nth(side === "借方" ? 0 : 1).click();
      await w.getByLabel(`${side}の科目${i + 1}`).fill(lines[i][0]);
      await w.getByLabel(`${side}の金額${i + 1}`).fill(lines[i][1]);
    }
  }
  await w.getByRole("button", { name: "記帳する" }).click();
  if (expectOk) await expect(page.getByRole("status").filter({ hasText: "できました" })).toBeVisible();
}

test("元本の一部を受取利息にした誤答に、貸付金を既に減らしていることと食い違わない説明が出る", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/loans");
  await next(page);
  await post(page, [["貸付金", "100000"]], [["普通預金", "100000"]]);
  await next(page);
  for (const [el, label] of Object.entries({ 資産: "増える", 負債: "変わらない", 純資産: "増える", 収益: "増える", 費用: "変わらない" }))
    await work(page).getByLabel(`${el}の予想`, { exact: true }).selectOption({ label });
  await work(page).getByRole("button", { name: "予想して記帳する" }).click();
  await next(page);
  await post(page, [["支払利息", "3000"]], [["普通預金", "3000"]]);
  await next(page);
  await work(page).getByPlaceholder("金額(円)").fill("3000");
  await work(page).getByRole("button", { name: "確認する" }).click();
  await next(page);
  await post(page, [["普通預金", "100000"]], [["貸付金", "98000"], ["受取利息", "2000"]], false);
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(status).toBeVisible();
  await expect(status).not.toContainText("受取利息ではなく貸付金を減らします");
  await expect(status).toContainText("すべて元本");
});

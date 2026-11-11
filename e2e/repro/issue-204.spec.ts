import { expect, test, type Page } from "@playwright/test";

type Line = [account: string, amount: number];

const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const next = (page: Page) => page.getByRole("button", { name: "次へ →" }).click();

async function setLine(page: Page, side: "借方" | "貸方", n: number, [account, amount]: Line) {
  await work(page).getByLabel(`${side}の科目${n}`).fill(account);
  await work(page).getByLabel(`${side}の科目${n}`).press("Escape");
  await work(page).getByLabel(`${side}の金額${n}`).fill(String(amount));
}

async function postAndNext(page: Page, debit: Line[], credit: Line[]) {
  for (const [side, lines, addIndex] of [["借方", debit, 0], ["貸方", credit, 1]] as const) {
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) await work(page).getByRole("button", { name: "行を追加" }).nth(addIndex).click();
      await setLine(page, side, i + 1, lines[i]);
    }
  }
  await work(page).getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByRole("status").getByText("できました")).toBeVisible();
  await next(page);
}

// 予想は外しても進めるので、ここでは中身を問わない
async function predictAndNext(page: Page) {
  for (const k of ["資産", "負債", "純資産", "収益", "費用"]) await page.getByLabel(`${k}の予想`, { exact: true }).selectOption({ label: "減る" });
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();
  await next(page);
}

// Issue #204: 未収入金を売掛金と取り違えても比較表に差が出ず、汎用文だけが出ていた
test("ステップ8: 仮受金50,000 / 売掛金50,000に、未収入金との違いを説明する", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/temporary-and-deposits");
  await page.getByRole("button", { name: "今はしない" }).click();
  await next(page);
  await postAndNext(page, [["給料", 100000]], [["普通預金", 97000], ["預り金", 3000]]);
  await predictAndNext(page);
  await postAndNext(page, [["立替金", 2000]], [["現金", 2000]]);
  await postAndNext(page, [["仮払金", 20000]], [["現金", 20000]]);
  await postAndNext(page, [["旅費交通費", 18000], ["現金", 2000]], [["仮払金", 20000]]);
  await predictAndNext(page);

  await setLine(page, "借方", 1, ["仮受金", 50000]);
  await setLine(page, "貸方", 1, ["売掛金", 50000]);
  await work(page).getByRole("button", { name: "記帳する" }).click();
  const box = page.getByRole("status").filter({ hasText: "もう一歩" });
  await expect(box).toBeVisible();
  await expect(box).toContainText("売掛金ではなく未収入金");
  await expect(box.filter({ hasText: "まだ合っていません" })).toHaveCount(0);
});

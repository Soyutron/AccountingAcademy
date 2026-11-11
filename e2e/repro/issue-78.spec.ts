import { expect, test, type Page } from "@playwright/test";

const GENERIC = "結果の表で何が動くはずか";
type Line = [account: string, amount: number];

const work = (page: Page) => page.getByRole("region", { name: "ワークスペース" });
const wrong = (page: Page) => page.getByRole("status").filter({ hasText: "もう一歩" });

async function setLine(page: Page, side: "借方" | "貸方", n: number, [account, amount]: Line) {
  await work(page).getByLabel(`${side}の科目${n}`).fill(account);
  await work(page).getByLabel(`${side}の科目${n}`).press("Escape");
  await work(page).getByLabel(`${side}の金額${n}`).fill(String(amount));
}

const submit = (page: Page) => work(page).getByRole("button", { name: "記帳する" }).click();
const next = (page: Page) => page.getByRole("button", { name: "次へ →" }).click();

// 正解を記帳して次のステップへ進む
async function postAndNext(page: Page, debit: Line[], credit: Line[]) {
  for (const [side, lines, addIndex] of [["借方", debit, 0], ["貸方", credit, 1]] as const) {
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) await work(page).getByRole("button", { name: "行を追加" }).nth(addIndex).click();
      await setLine(page, side, i + 1, lines[i]);
    }
  }
  await submit(page);
  await expect(page.getByRole("status").getByText("できました")).toBeVisible();
  await next(page);
}

// Issue #78: 資産同士の取り違えで比較表に差が出ないのに、誤答パターンが無く汎用文だけが出ていた
test("仮払金の精算で、仮払金の消し残しと現金の取り違えに専用の説明が出る", async ({ page }) => {
  await page.goto("/units/receivables-and-payables/temporary-and-deposits");
  await page.getByRole("button", { name: "今はしない" }).click();
  await next(page);
  await postAndNext(page, [["給料", 100000]], [["普通預金", 97000], ["預り金", 3000]]);
  for (const k of ["資産", "負債", "純資産", "収益", "費用"]) await page.getByLabel(`${k}の予想`, { exact: true }).selectOption({ label: "減る" });
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(wrong(page)).toBeVisible();
  await next(page);
  await postAndNext(page, [["立替金", 2000]], [["現金", 2000]]);
  await postAndNext(page, [["仮払金", 20000]], [["現金", 20000]]);
  await expect(page.getByText("ステップ6 / 10")).toBeVisible();

  await setLine(page, "借方", 1, ["旅費交通費", 18000]);
  await setLine(page, "貸方", 1, ["仮払金", 18000]);
  await submit(page);
  await expect(wrong(page)).toContainText("2,000");
  await expect(wrong(page)).not.toContainText(GENERIC);
  await expect(page.getByText("よくある思い込み: 精算では使った分だけ仮払金を消す")).toBeVisible();

  await work(page).getByRole("button", { name: "行を追加" }).first().click();
  await setLine(page, "借方", 2, ["現金", 2000]);
  await setLine(page, "貸方", 1, ["現金", 20000]);
  await submit(page);
  await expect(wrong(page)).toContainText("仮払金");
  await expect(wrong(page)).not.toContainText(GENERIC);
  await expect(page.getByText("よくある思い込み: 精算で現金を減らす")).toBeVisible();
});

test("小口現金の週末の報告で、3つの費用を通信費に寄せると専用の説明が出る", async ({ page }) => {
  await page.goto("/units/cash-and-deposits/petty-cash");
  await page.getByRole("button", { name: "今はしない" }).click();
  await next(page);
  await postAndNext(page, [["小口現金", 30000]], [["当座預金", 30000]]);
  await next(page);
  await expect(page.getByText("ステップ4 / 9")).toBeVisible();

  await setLine(page, "借方", 1, ["通信費", 12500]);
  await setLine(page, "貸方", 1, ["小口現金", 12500]);
  await submit(page);
  await expect(wrong(page)).toContainText("使い道");
  await expect(wrong(page)).not.toContainText(GENERIC);
  await expect(page.getByText("よくある思い込み: 使い道が違っても1つの費用にまとめてよい")).toBeVisible();
});

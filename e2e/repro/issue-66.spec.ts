import { type Page, expect, test } from "@playwright/test";

// 売れ残りと売上原価のステップ6(仕分けボード)まで正解で進める
async function openBoard(page: Page) {
  await page.goto("/units/merchandise/cost-of-goods-sold");
  const next = () => page.getByRole("button", { name: "次へ →" }).click();
  const ok = () => expect(page.getByRole("status").getByText("できました")).toBeVisible();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await next();
  await page.getByPlaceholder("金額(円)").fill("125000");
  await page.getByRole("button", { name: "確認する" }).click();
  await ok();
  await next();
  await work.getByLabel("借方の科目1").fill("仕入");
  await work.getByLabel("借方の金額1").fill("15000");
  await work.getByLabel("貸方の科目1").fill("繰越商品");
  await work.getByLabel("貸方の金額1").fill("15000");
  await page.getByRole("button", { name: "記帳する" }).click();
  await ok();
  await next();
  const pred: Record<string, string> = { 資産: "増える", 負債: "変わらない", 純資産: "増える", 収益: "変わらない", 費用: "減る" };
  for (const [el, v] of Object.entries(pred)) {
    const sel = page.getByLabel(`${el}の予想`, { exact: true });
    const label = (await sel.locator("option").allTextContents()).find((t) => t.includes(v))!;
    await sel.selectOption({ label });
  }
  await page.getByRole("button", { name: "予想して記帳する" }).click();
  await ok();
  await next();
  await page.getByPlaceholder("金額(円)").fill("-71500");
  await page.getByRole("button", { name: "確認する" }).click();
  await ok();
  await next();
  const board = page.getByRole("group", { name: "仕分けボード" });
  const putIn = (box: string) => board.getByRole("button", { name: `${box} ← ここに入れる`, exact: true }).click();
  const place = async (account: string, box: string) => {
    await board.getByRole("button", { name: account, exact: true }).click();
    await putIn(box);
  };
  const move = async (account: string, box: string) => {
    await board.getByRole("button", { name: new RegExp(`^${account}`) }).click();
    await putIn(box);
  };
  return { board, place, move };
}

test("間違えた科目を正しい箱へ移すと、間違いの印と「もう一歩」が消え、もう一度確認すると正解になる", async ({ page }) => {
  const { board, place, move } = await openBoard(page);
  await place("仕入", "資産");
  await place("繰越商品", "資産");
  await place("売上", "収益");
  await place("売掛金", "資産");
  await page.getByRole("button", { name: "確認する" }).click();
  const status = page.getByRole("status");
  await expect(status.getByText("もう一歩")).toBeVisible();
  await expect(board.getByRole("button", { name: "仕入 (間違い)" })).toBeVisible();

  await move("仕入", "費用");
  await expect(board.getByRole("button", { name: "仕入", exact: true })).toBeVisible();
  await expect(board.getByText("(間違い)")).toHaveCount(0);
  await expect(status.getByText("もう一歩")).toHaveCount(0);

  await page.getByRole("button", { name: "確認する" }).click();
  await expect(status.getByText("できました")).toBeVisible();
});

test("間違えた科目が複数なら、移した科目の分だけ印と説明が減り、同じ箱へ戻すと印も戻る", async ({ page }) => {
  const { board, place, move } = await openBoard(page);
  await place("仕入", "資産");
  await place("繰越商品", "資産");
  await place("売上", "費用");
  await place("売掛金", "資産");
  await page.getByRole("button", { name: "確認する" }).click();
  const status = page.getByRole("status");
  await expect(status.getByText("2個の科目")).toBeVisible();

  await move("仕入", "費用");
  await expect(board.getByText("(間違い)")).toHaveCount(1);
  await expect(board.getByRole("button", { name: "売上 (間違い)" })).toBeVisible();
  await expect(status.getByText("1個の科目")).toBeVisible();
  await expect(status.getByText(/^仕入は費用です/)).toHaveCount(0);
  await expect(status.getByText(/^売上は収益です/)).toBeVisible();

  await move("仕入", "資産");
  await expect(board.getByRole("button", { name: "仕入 (間違い)" })).toBeVisible();
  await expect(status.getByText("2個の科目")).toBeVisible();
});

import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

type Unit = { id: string; steps: { narrative: string }[] };
const units: Unit[] = JSON.parse(readFileSync(".velite/units.json", "utf8"));
const narrative = (id: string, step: number) => units.find((u) => u.id === id)!.steps[step - 1].narrative;

// Issue #206: predictの直前の本文が5要素の動きや仕訳の左右をそのまま書いていて、予想が本文の書き写しになっていた。
// 本文は「状況 + 科目の定義(初出のみ)+ 問いかけ」に留め、動きの説明はsuccessとwrong_patternsに置く
const answersInNarrative: [string, number, string][] = [
  ["receivables-and-payables/temporary-and-deposits", 3, "預り金という義務が消え、現金が減ります"],
  ["receivables-and-payables/temporary-and-deposits", 7, "という負債に置きます"],
  ["receivables-and-payables/loans", 7, "預金が減り、借入金が同じだけ減ります"],
  ["receivables-and-payables/other-receivables-and-payables", 3, "椅子は長く使うので備品(資産)です"],
  ["receivables-and-payables/other-receivables-and-payables", 6, "渡していないので売上ではありません"],
  ["cash-and-deposits/checking-account", 3, "減るのは当座預金です"],
  ["cash-and-deposits/cash-over-and-short", 3, "左に通信費2,000、右に現金過不足2,000"],
  // 「しーくり、くりしー」の2本目。#65の組み替え後はステップ4
  ["merchandise/cost-of-goods-sold", 4, "左に繰越商品22,000、右に仕入22,000"],
];

for (const [id, step, phrase] of answersInNarrative) {
  test(`${id} ステップ${step}の本文が答え「${phrase}」を書いていない`, () => {
    const text = narrative(id, step);
    expect(text).not.toContain(phrase);
    expect(text).toMatch(/でしょうか。/);
  });
}

test("預り金の納付のステップで、答えを書かずに予想の案内が見える", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const guide = page.getByRole("region", { name: "ガイド" });
  const next = page.getByRole("button", { name: "次へ →" });
  const fill = async (label: string, value: string) => work.getByLabel(label, { exact: true }).fill(value);

  await page.goto("/units/receivables-and-payables/temporary-and-deposits");
  await next.click();
  await fill("借方の科目1", "給料");
  await fill("借方の金額1", "100000");
  await fill("貸方の科目1", "普通預金");
  await fill("貸方の金額1", "97000");
  await work.getByRole("button", { name: "行を追加" }).nth(1).click();
  await fill("貸方の科目2", "預り金");
  await fill("貸方の金額2", "3000");
  await work.getByRole("button", { name: "記帳する", exact: true }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();

  await expect(page.getByText("記帳の前に、どう動くか予想しましょう")).toBeVisible();
  await expect(guide).toContainText("納めた後どうなるでしょうか");
  await expect(guide).not.toContainText("預り金という義務が消え、現金が減ります");
  await expect(work.getByLabel("負債の予想", { exact: true })).toBeVisible();
});

import { describe, expect, it } from "vitest";
import { accountMap, unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #217: 5要素の動きが正解と同じ誤答に、結果の表を見直させる文が出て、全行「同じ」の表と矛盾していた
const GENERIC = "結果の表で何が動くはずか";
const SAME_IMPACT = "5つの要素の動きは合っています。使っている科目を見直しましょう。";

const postTask = (unitId: string, index: number) => {
  const t = unitMap.get(unitId)!.steps[index].task;
  if (t.type !== "post") throw new Error("postではない");
  return t;
};
const entry = (debit: [string, number][], credit: [string, number][]) => ({
  debit: debit.map(([account, amount]) => ({ account, amount })),
  credit: credit.map(([account, amount]) => ({ account, amount })),
});

const FIVE = "bookkeeping-basics/five-elements";
const RETURNS = "merchandise/returns-and-costs";
const CREDIT = "merchandise/credit-transactions";

describe("5要素の動きが正解と同じ誤答", () => {
  it.each([
    ["普通預金で受けた元入れ", entry([["bank_deposit", 1000000]], [["capital_stock", 1000000]])],
    ["現金と普通預金に分けた元入れ", entry([["cash", 500000], ["bank_deposit", 500000]], [["capital_stock", 1000000]])],
  ])("%sには科目を見直させる文を出す", (_name, wrong) => {
    const result = gradePost(postTask(FIVE, 1), wrong, accountMap);
    expect(result.correct).toBe(false);
    expect(result.feedback).toBe(SAME_IMPACT);
  });

  // 誤答パターンに専用の説明があればそれが出る。どちらでも結果の表を見直させる文は出さない
  it.each([
    ["運賃を売掛金から引く", RETURNS, 3, entry([["accounts_receivable", 28500], ["shipping_expense", 1500]], [["sales", 30000]])],
    ["普通預金 / 現金", CREDIT, 4, entry([["bank_deposit", 60000]], [["cash", 60000]])],
    ["買掛金 / 普通預金", CREDIT, 5, entry([["accounts_payable", 40000]], [["bank_deposit", 40000]])],
    ["買掛金 / 売掛金", CREDIT, 5, entry([["accounts_payable", 40000]], [["accounts_receivable", 40000]])],
  ])("%sには結果の表を見直させる文を出さない", (_name, unitId, index, wrong) => {
    const result = gradePost(postTask(unitId, index), wrong, accountMap);
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("相殺行は余計な行として案内する", () => {
    const result = gradePost(postTask(FIVE, 1), entry([["cash", 1000000], ["cash_over_and_short", 5]], [["capital_stock", 1000000], ["cash_over_and_short", 5]]), accountMap);
    expect(result.feedback).not.toContain(GENERIC);
    expect(result.feedback).not.toBe(SAME_IMPACT);
  });
});

describe("従来の分岐は変わらない", () => {
  const task = postTask(FIVE, 1);

  it("貸借逆は誤解を返す", () => {
    expect(gradePost(task, { debit: task.answer.credit, credit: task.answer.debit }, accountMap).misconception).toBe("debit_means_increase");
  });

  it("金額違いは金額を見直させる", () => {
    expect(gradePost(task, entry([["cash", 900000]], [["capital_stock", 900000]]), accountMap).feedback).toContain("金額");
  });

  it("5要素の動きが違う誤答は結果の表を見直させる", () => {
    expect(gradePost(task, entry([["cash", 1000000]], [["accounts_payable", 1000000]]), accountMap).feedback).toContain(GENERIC);
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer, accountMap).correct).toBe(true);
  });
});

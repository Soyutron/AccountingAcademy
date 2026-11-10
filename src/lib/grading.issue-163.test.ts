import { describe, expect, it } from "vitest";
import { accountMap, unitMap } from "./content";
import { gradeCalc, gradeClassify, gradePost, gradePredict } from "./grading";

// Issue #163: 単元の中心の取り違えに誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずかを考えて";

const task = (unitId: string, index: number) => unitMap.get(unitId)!.steps[index].task;
const postTask = (unitId: string, index: number) => {
  const t = task(unitId, index);
  if (t.type !== "post") throw new Error("post ではない");
  return t;
};
const entry = (debit: string, credit: string, amount: number) => ({
  debit: [{ account: debit, amount }],
  credit: [{ account: credit, amount }],
});

const LOANS = "receivables-and-payables/loans";
const STRAIGHT_LINE = "depreciation/straight-line";
const CASH_OVER = "cash-and-deposits/cash-over-and-short";

describe("仕訳の取り違えに、誤解と説明が付く", () => {
  it.each([
    ["loans 2 貸付金 / 現金", LOANS, 1, "loans_receivable", "cash", 100000, "deposit_is_cash", "普通預金"],
    ["loans 2 借入金 / 普通預金", LOANS, 1, "loans_payable", "bank_deposit", 100000, "lender_borrower_confused", "貸付金"],
    ["loans 4 支払利息 / 現金", LOANS, 3, "interest_expense", "cash", 3000, "deposit_is_cash", "普通預金"],
    ["loans 4 受取利息 / 普通預金", LOANS, 3, "interest_income", "bank_deposit", 3000, "interest_income_expense_confused", "支払利息"],
    ["loans 6 普通預金 / 借入金", LOANS, 5, "bank_deposit", "loans_payable", 100000, "lender_borrower_confused", "貸付金"],
    ["loans 6 現金 / 貸付金", LOANS, 5, "cash", "loans_receivable", 100000, "deposit_is_cash", "普通預金"],
    ["straight-line 2 備品 / 現金", STRAIGHT_LINE, 1, "equipment", "cash", 1200000, "vehicle_is_equipment", "車両運搬具"],
    ["straight-line 2 備品 / 普通預金は科目の誤りを優先", STRAIGHT_LINE, 1, "equipment", "bank_deposit", 1200000, "vehicle_is_equipment", "車両運搬具"],
    ["straight-line 2 車両運搬具 / 普通預金", STRAIGHT_LINE, 1, "vehicle", "bank_deposit", 1200000, "deposit_is_cash", "現金で"],
    ["cash-over 2 通信費 / 現金", CASH_OVER, 1, "communication_expense", "cash", 3000, "shortage_is_loss", "現金過不足"],
    ["cash-over 5 通信費 / 現金過不足", CASH_OVER, 4, "communication_expense", "cash_over_and_short", 1000, "unknown_shortage_as_known_expense", "雑損"],
  ] as const)("%s", (_, unitId, index, debit, credit, amount, misconception, keyword) => {
    const result = gradePost(postTask(unitId, index), entry(debit, credit, amount));
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain(GENERIC);
    expect(result.misconception).toBe(misconception);
    expect(result.feedback).toContain(keyword);
  });
});

describe("loans の post 以外の取り違え", () => {
  it("ステップ 5: 月数をそのまま掛けた 36000 に、÷12 を指す説明が出る", () => {
    const t = task(LOANS, 4);
    if (t.type !== "calc") throw new Error("calc ではない");
    const result = gradeCalc(t, 36000);
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("interest_months_not_divided");
    expect(result.feedback).toContain("6/12");
  });

  it("ステップ 7: 資産だけ「変わらない」にすると、資産が減る説明が出る", () => {
    const t = task(LOANS, 6);
    if (t.type !== "predict") throw new Error("predict ではない");
    const result = gradePredict(t, { ...t.answer, asset: "none" });
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("資産は減ります");
  });

  it("ステップ 8: 貸付金と借入金を逆の箱に入れると、取り違えの誤解が付く", () => {
    const t = task(LOANS, 7);
    if (t.type !== "classify") throw new Error("classify ではない");
    const result = gradeClassify(
      t,
      { loans_receivable: "liability", loans_payable: "asset", interest_income: "revenue", interest_expense: "expense" },
      accountMap,
    );
    expect(result.correct).toBe(false);
    expect(result.misconceptions).toEqual(["lender_borrower_confused"]);
  });
});

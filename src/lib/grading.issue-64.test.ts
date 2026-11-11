import { describe, expect, it } from "vitest";
import { type EffectAnswer, type TaskOf, gradePredict } from "./grading";

// Issue #64: predictで複数の要素を外すと、最初の誤答パターンの説明と誤解しか返らなかった
const none: EffectAnswer = { asset: "none", liability: "none", equity: "none", revenue: "none", expense: "none" };
const task: TaskOf<"predict"> = {
  type: "predict",
  transaction: "備品を現金で買った",
  entry: { debit: [{ account: "equipment", amount: 600000 }], credit: [{ account: "cash", amount: 600000 }] },
  answer: none,
  wrong_patterns: [
    { match: { asset: "decrease" }, misconception: "cash_is_only_asset", feedback: "資産の中身が入れ替わっただけです。" },
    { match: { expense: "increase" }, misconception: "expense_at_payment", feedback: "払った時点では費用になりません。" },
    { match: { revenue: "increase" }, feedback: "売上は動きません。" },
    { match: { liability: "increase" }, misconception: "expense_at_payment", feedback: "負債は動きません。" },
  ],
};

describe("gradePredict: 複数の要素を外したとき(Issue #64)", () => {
  it("一致したすべてのパターンの説明と誤解を返し、保存する誤解は先頭のものにする", () => {
    const r = gradePredict(task, { ...none, asset: "decrease", expense: "increase" });
    expect(r.correct).toBe(false);
    expect(r.feedback).toBe("資産の中身が入れ替わっただけです。\n払った時点では費用になりません。");
    expect(r.misconception).toBe("cash_is_only_asset");
    expect(r.misconceptions).toEqual(["cash_is_only_asset", "expense_at_payment"]);
  });

  it("同じ誤解に複数のパターンが一致しても誤解は1件にする", () => {
    const r = gradePredict(task, { ...none, expense: "increase", liability: "increase" });
    expect(r.misconceptions).toEqual(["expense_at_payment"]);
  });

  it("先頭の一致に誤解が無ければ、誤解を持つ次のパターンを主な誤解にする", () => {
    const r = gradePredict(task, { ...none, revenue: "increase", expense: "increase" });
    expect(r.misconception).toBe("expense_at_payment");
  });

  it("1つだけ外したときはその説明だけ、どれにも一致しなければ汎用文を返す", () => {
    const one = gradePredict(task, { ...none, expense: "increase" });
    expect(one.feedback).toBe("払った時点では費用になりません。");
    const unmatched = gradePredict(task, { ...none, equity: "increase" });
    expect(unmatched.feedback).toContain("予想と実際の動きが違いました");
    expect(unmatched.misconception).toBeUndefined();
    expect(unmatched.misconceptions).toEqual([]);
  });
});

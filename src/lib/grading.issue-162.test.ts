import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #162: 正しい行に余計な行を足した仕訳や、貸借逆で金額も違う仕訳に、一部だけ合った別の誤解が付いていた
const postTask = (unitId: string, index: number) => {
  const task = unitMap.get(unitId)!.steps[index].task;
  if (task.type !== "post") throw new Error("postではない");
  return task;
};

describe("貸付金の回収(貸したお金、借りたお金 ステップ6)", () => {
  const task = postTask("receivables-and-payables/loans", 5);

  it("貸付金を減らした上で受取利息を足すと、利息は別の入金だと説明する", () => {
    const result = gradePost(task, {
      debit: [{ account: "bank_deposit", amount: 102000 }],
      credit: [{ account: "loans_receivable", amount: 100000 }, { account: "interest_income", amount: 2000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("repayment_includes_interest");
    expect(result.feedback).toContain("別の入金");
  });

  it("元本を受取利息にした誤りはprincipal_is_revenueのまま", () => {
    const result = gradePost(task, {
      debit: [{ account: "bank_deposit", amount: 100000 }],
      credit: [{ account: "interest_income", amount: 100000 }],
    });
    expect(result.misconception).toBe("principal_is_revenue");
  });

  it("正しい行に、パターンが触れない行を足すと余計な行の説明になる", () => {
    const result = gradePost(task, {
      debit: [{ account: "bank_deposit", amount: 100000 }, { account: "interest_expense", amount: 5000 }],
      credit: [{ account: "loans_receivable", amount: 100000 }, { account: "cash", amount: 5000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("正しい行はそろっています");
  });
});

describe("定額法の決算(定額法 ステップ7)", () => {
  const task = postTask("depreciation/straight-line", 6);

  it("貸借逆で金額も違うと、月割りではなく左右の誤りを指摘する", () => {
    const result = gradePost(task, {
      debit: [{ account: "accumulated_depreciation", amount: 100000 }],
      credit: [{ account: "depreciation_expense", amount: 100000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).not.toBe("forgot_monthly_proration");
    expect(result.feedback).toContain("左右を入れ替え");
  });

  it("月割りを忘れただけの仕訳はforgot_monthly_prorationのまま", () => {
    const result = gradePost(task, {
      debit: [{ account: "depreciation_expense", amount: 100000 }],
      credit: [{ account: "accumulated_depreciation", amount: 100000 }],
    });
    expect(result.misconception).toBe("forgot_monthly_proration");
  });
});

describe("仮払金の精算(預かったお金、仮のお金 ステップ6)", () => {
  const task = postTask("receivables-and-payables/temporary-and-deposits", 5);

  it("現金を左に書いた上で雑益を足した仕訳に「現金も記録しましょう」と出さない", () => {
    const result = gradePost(task, {
      debit: [{ account: "travel_expense", amount: 18000 }, { account: "cash", amount: 2000 }],
      credit: [{ account: "suspense_payment", amount: 18000 }, { account: "miscellaneous_income", amount: 2000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).not.toBe("settlement_clears_only_spent");
    expect(result.feedback).not.toContain("現金も記録しましょう");
  });
});

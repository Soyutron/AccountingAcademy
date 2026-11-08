import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #78: 資産同士の取り違えは比較表に差が出ないのに、誤答パターンが無く汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const postTask = (unitId: string, index: number) => {
  const task = unitMap.get(unitId)!.steps[index].task;
  if (task.type !== "post") throw new Error("post ではない");
  return task;
};

describe("仮払金の精算(ステップ 6)", () => {
  const task = postTask("receivables-and-payables/temporary-and-deposits", 5);

  it("使った分だけ仮払金を消すと settlement_clears_only_spent", () => {
    const result = gradePost(task, {
      debit: [{ account: "travel_expense", amount: 18000 }],
      credit: [{ account: "suspense_payment", amount: 18000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("settlement_clears_only_spent");
    expect(result.feedback).toContain("2,000");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("仮払金の代わりに現金を減らすと settlement_credits_cash", () => {
    const result = gradePost(task, {
      debit: [
        { account: "travel_expense", amount: 18000 },
        { account: "cash", amount: 2000 },
      ],
      credit: [{ account: "cash", amount: 20000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("settlement_credits_cash");
    expect(result.feedback).toContain("仮払金");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("全額を費用にする誤りは settlement_full_amount_is_expense のまま", () => {
    const result = gradePost(task, {
      debit: [{ account: "travel_expense", amount: 20000 }],
      credit: [{ account: "cash", amount: 20000 }],
    });
    expect(result.misconception).toBe("settlement_full_amount_is_expense");
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});

describe("小口現金の週末の報告(ステップ 4)", () => {
  const task = postTask("cash-and-deposits/petty-cash", 3);

  it("3 つの費用を通信費に寄せると petty_expenses_lumped", () => {
    const result = gradePost(task, {
      debit: [{ account: "communication_expense", amount: 12500 }],
      credit: [{ account: "petty_cash", amount: 12500 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("petty_expenses_lumped");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("通信費に寄せて貸方を現金にした場合は petty_cash_is_cash のまま", () => {
    const result = gradePost(task, {
      debit: [{ account: "communication_expense", amount: 12500 }],
      credit: [{ account: "cash", amount: 12500 }],
    });
    expect(result.misconception).toBe("petty_cash_is_cash");
  });
});

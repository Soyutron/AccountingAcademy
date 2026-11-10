import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #245: 入口の 3 単元で、自然な誤答に誤答パターンが無く、誤解 ID の無い汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";

const postTask = (unit: string, step: number) => {
  const task = unitMap.get(unit)!.steps[step].task;
  if (task.type !== "post") throw new Error("post ではない");
  return task;
};

describe("誤答に当てた説明と誤解 ID を返す", () => {
  it.each([
    ["bookkeeping-basics/five-elements", 3, "bank_deposit", "loans_payable", 300000, "deposit_is_cash", "現金で受け取って"],
    ["bookkeeping-basics/five-elements", 5, "capital_stock", "cash", 50000, "payment_reduces_capital", "費用"],
    ["bookkeeping-basics/five-elements", 5, "rent_expense", "loans_payable", 50000, "expense_as_liability", "減ったのは現金"],
    ["merchandise/three-account-method", 1, "purchases", "bank_deposit", 30000, "deposit_is_cash", "現金で支払って"],
    ["merchandise/three-account-method", 3, "cash", "capital_stock", 90000, "sale_proceeds_as_capital_or_loan", "元手"],
    ["merchandise/three-account-method", 3, "cash", "loans_payable", 90000, "sale_proceeds_as_capital_or_loan", "返す必要のない"],
    ["cash-and-deposits/cash-over-and-short", 4, "communication_expense", "cash_over_and_short", 1000, "unknown_shortage_as_known_expense", "原因が分かった"],
    ["cash-and-deposits/cash-over-and-short", 4, "miscellaneous_loss", "bank_deposit", 1000, "shortage_transfer_moves_money", "帳簿の中"],
  ])("%s ステップ %i: %s / %s", (unit, step, debit, credit, amount, misconception, phrase) => {
    const result = gradePost(postTask(unit, step), { debit: [{ account: debit, amount }], credit: [{ account: credit, amount }] });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe(misconception);
    expect(result.feedback).toContain(phrase);
    expect(result.feedback).not.toContain(GENERIC);
  });
});

describe("足したパターンが既存の判定を奪わない", () => {
  it("貸借が逆の家賃は、左右の説明のまま", () => {
    const result = gradePost(postTask("bookkeeping-basics/five-elements", 5), {
      debit: [{ account: "cash", amount: 50000 }],
      credit: [{ account: "rent_expense", amount: 50000 }],
    });
    expect(result.feedback).toContain("左右を入れ替えて");
  });

  it("左が備品で右が普通預金の仕入は、備品の説明のまま", () => {
    const result = gradePost(postTask("merchandise/three-account-method", 1), {
      debit: [{ account: "equipment", amount: 30000 }],
      credit: [{ account: "bank_deposit", amount: 30000 }],
    });
    expect(result.misconception).toBe("purchase_is_asset");
  });
});

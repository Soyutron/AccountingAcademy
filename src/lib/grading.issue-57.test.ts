import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #57: 小口現金を「現金」と書く、切手代を消耗品費にする誤りが汎用文に落ちていた
const steps = unitMap.get("cash-and-deposits/petty-cash")!.steps;
const postTask = (index: number) => {
  const task = steps[index].task;
  if (task.type !== "post") throw new Error("postではない");
  return task;
};

describe("小口現金を渡す(ステップ2)", () => {
  const task = postTask(1);

  it("借方を現金にするとpetty_cash_is_cash", () => {
    const result = gradePost(task, {
      debit: [{ account: "cash", amount: 30000 }],
      credit: [{ account: "checking_account", amount: 30000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("petty_cash_is_cash");
  });

  it("小口現金 / 現金 はcheck_is_cashのまま", () => {
    const result = gradePost(task, {
      debit: [{ account: "petty_cash", amount: 30000 }],
      credit: [{ account: "cash", amount: 30000 }],
    });
    expect(result.misconception).toBe("check_is_cash");
  });
});

describe("週末の報告(ステップ4)", () => {
  const task = postTask(3);
  const expenses = [
    { account: "communication_expense", amount: 4000 },
    { account: "supplies_expense", amount: 6500 },
    { account: "travel_expense", amount: 2000 },
  ];

  it("貸方を現金にするとpetty_cash_is_cash", () => {
    const result = gradePost(task, { debit: expenses, credit: [{ account: "cash", amount: 12500 }] });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("petty_cash_is_cash");
  });

  it.each([
    ["行を分けた場合", [{ account: "supplies_expense", amount: 4000 }, { account: "supplies_expense", amount: 6500 }, { account: "travel_expense", amount: 2000 }]],
    ["1行にまとめた場合", [{ account: "supplies_expense", amount: 10500 }, { account: "travel_expense", amount: 2000 }]],
  ])("切手代を消耗品費にすると通信費の説明が出る(%s)", (_, debit) => {
    const result = gradePost(task, { debit, credit: [{ account: "petty_cash", amount: 12500 }] });
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("通信費");
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, { debit: expenses, credit: [{ account: "petty_cash", amount: 12500 }] }).correct).toBe(true);
  });
});

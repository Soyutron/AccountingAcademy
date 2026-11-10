import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost, gradePredict, type Task, type TaskOf } from "./grading";

// Issue #153: 小切手の取引での買掛金・預金との取り違えに誤答パターンが無く、汎用文だけが出ていた
describe("小切手で払う の取り違え", () => {
  const taskOf = (title: string): Task => unitMap.get("cash-and-deposits/checking-account")!.steps.find((s) => s.title === title)!.task;

  it("小切手で払うと負債が増えると予想したら、払えば買掛金は減ると説明する", () => {
    const task = taskOf("買掛金を小切手で払う") as TaskOf<"predict">;
    const result = gradePredict(task, { asset: "decrease", liability: "increase", equity: "none", revenue: "none", expense: "none" });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("issued_check_leaves_payable");
    expect(result.feedback).toContain("買掛金");
    expect(result.feedback).toContain("減ります");
  });

  it("小切手で払った仕入を買掛金にしたら、支払いは済んでいると説明する", () => {
    const task = taskOf("仕入も小切手で") as TaskOf<"post">;
    const result = gradePost(task, {
      debit: [{ account: "purchases", amount: 25000 }],
      credit: [{ account: "accounts_payable", amount: 25000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("issued_check_leaves_payable");
    expect(result.feedback).toContain("済んでいます");
  });

  it("受け取った小切手を普通預金にしたら、現金として記録すると説明する", () => {
    const task = taskOf("受け取った小切手") as TaskOf<"post">;
    const result = gradePost(task, {
      debit: [{ account: "bank_deposit", amount: 30000 }],
      credit: [{ account: "sales", amount: 30000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("received_check_is_checking_account");
    expect(result.feedback).toContain("現金");
  });

  it("左右の金額が違っても、買掛金の取り違えを説明する", () => {
    const task = taskOf("仕入も小切手で") as TaskOf<"post">;
    const result = gradePost(task, {
      debit: [{ account: "purchases", amount: 25000 }],
      credit: [{ account: "accounts_payable", amount: 20000 }],
    });
    expect(result.misconception).toBe("issued_check_leaves_payable");
  });
});

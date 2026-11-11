import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #29: 同じ科目を複数行に分けて記帳すると、合計が正解と同じでも汎用文の「もう一歩」に落ちていた
describe("掛けで仕入れる(同じ科目を複数行に分ける)", () => {
  const step = unitMap.get("merchandise/credit-transactions")!.steps[1];
  if (step.task.type !== "post") throw new Error("postではない");
  const task = step.task;

  it("仕入30,000 + 10,000 / 買掛金40,000は正解", () => {
    const result = gradePost(task, {
      debit: [
        { account: "purchases", amount: 30000 },
        { account: "purchases", amount: 10000 },
      ],
      credit: [{ account: "accounts_payable", amount: 40000 }],
    });
    expect(result.correct).toBe(true);
  });

  it("左右を入れ替えて分けた仕訳は貸借逆の誤解に当たる", () => {
    const result = gradePost(task, {
      debit: [
        { account: "accounts_payable", amount: 20000 },
        { account: "accounts_payable", amount: 20000 },
      ],
      credit: [{ account: "purchases", amount: 40000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("debit_means_increase");
  });

  it("分けた行の合計が正解と違えば正解にしない", () => {
    const result = gradePost(task, {
      debit: [
        { account: "purchases", amount: 30000 },
        { account: "purchases", amount: 20000 },
      ],
      credit: [{ account: "accounts_payable", amount: 50000 }],
    });
    expect(result.correct).toBe(false);
  });
});

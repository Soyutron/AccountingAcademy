import { describe, expect, it } from "vitest";
import { accountMap, unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #47: 資産・費用だけの仕訳は「借方 = 増加」の規則どおりに書けば正解になるので、貸借逆にその誤解を付けない
describe("資産・費用だけの仕訳の貸借逆", () => {
  it("swappedパターンにdebit_means_increaseを付けない", () => {
    const bad: string[] = [];
    for (const unit of unitMap.values()) {
      unit.steps.forEach((step, i) => {
        const task = step.task;
        if (task?.type !== "post") return;
        const lines = [...task.answer.debit, ...task.answer.credit];
        const onlyAssetExpense = lines.every((l) => {
          const a = accountMap.get(l.account);
          return a && !a.contra && (a.element === "asset" || a.element === "expense");
        });
        if (!onlyAssetExpense) return;
        if (task.wrong_patterns?.some((w) => w.match?.swapped && w.misconception === "debit_means_increase")) {
          bad.push(`${unit.id} step${i + 1}`);
        }
      });
    }
    expect(bad).toEqual([]);
  });

  it("利息の支払いを貸借逆にすると、誤解なしでfeedbackを返す", () => {
    const step = unitMap.get("receivables-and-payables/loans")!.steps[3];
    if (step.task?.type !== "post") throw new Error("postではない");
    const r = gradePost(step.task, {
      debit: [{ account: "bank_deposit", amount: 3000 }],
      credit: [{ account: "interest_expense", amount: 3000 }],
    });
    expect(r.correct).toBe(false);
    expect(r.misconception).toBeUndefined();
    expect(r.feedback).toBeTruthy();
  });
});

import { describe, expect, it } from "vitest";
import { misconceptionMap, unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #257: 貸借逆の誤答パターンに誤解が無く、21ステップで「よくある思い込み」が出ず誤解IDも保存されなかった
describe("貸借逆の誤答パターン", () => {
  it("postのswappedパターンは必ず誤解を持つ", () => {
    const bad: string[] = [];
    for (const unit of unitMap.values()) {
      unit.steps.forEach((step, i) => {
        const task = step.task;
        if (task?.type !== "post") return;
        task.wrong_patterns.forEach((w) => {
          if (w.match?.swapped && !w.misconception) bad.push(`${unit.id} step${i + 1}`);
        });
      });
    }
    expect(bad).toEqual([]);
  });

  it("貸付金を貸借逆にすると「お金が出ていく側を左に書く」を返す", () => {
    const step = unitMap.get("receivables-and-payables/loans")!.steps[1];
    if (step.task?.type !== "post") throw new Error("postではない");
    const r = gradePost(step.task, { debit: step.task.answer.credit, credit: step.task.answer.debit });
    expect(r.correct).toBe(false);
    expect(r.misconception).toBe("outflow_on_debit");
    expect(misconceptionMap.get("outflow_on_debit")?.name).toBe("お金が出ていく側を左に書く");
  });

  it("負債を含む仕訳の貸借逆はdebit_means_increaseを返す", () => {
    const step = unitMap.get("receivables-and-payables/temporary-and-deposits")!.steps[7];
    if (step.task?.type !== "post") throw new Error("postではない");
    const r = gradePost(step.task, { debit: step.task.answer.credit, credit: step.task.answer.debit });
    expect(r.correct).toBe(false);
    expect(r.misconception).toBe("debit_means_increase");
  });
});

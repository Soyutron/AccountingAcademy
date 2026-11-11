import { describe, expect, it } from "vitest";
import { type TaskOf, gradePost } from "./grading";
import { unitMap } from "./content";

function postTask(unitId: string, transaction: string): TaskOf<"post"> {
  const task = unitMap.get(unitId)!.steps.map((s) => s.task).find((t) => t.type === "post" && t.transaction.includes(transaction));
  if (task?.type !== "post") throw new Error("postの課題が見つからない");
  return task;
}

// Issue #60: 科目が正解と同じで金額だけ違う仕訳が、「何が動くはず」の汎用文に落ちていた
describe("科目が合っていて金額だけ違う仕訳", () => {
  const task = postTask("receivables-and-payables/other-receivables-and-payables", "ショーケース");
  const entry = (debit: number, credit: number, accounts = ["accounts_receivable_other", "equipment"]) => ({
    debit: [{ account: accounts[0], amount: debit }],
    credit: [{ account: accounts[1], amount: credit }],
  });

  it.each([5000, 500000])("%iには金額を確かめる説明を返し、誤解IDは付けない", (amount) => {
    const result = gradePost(task, entry(amount, amount));
    expect(result.correct).toBe(false);
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("金額");
    expect(result.feedback).not.toContain("何が動くはず");
  });

  it("同じ科目を複数行に分けて合計だけ違うときも金額の説明になる", () => {
    const result = gradePost(task, {
      debit: [
        { account: "accounts_receivable_other", amount: 2000 },
        { account: "accounts_receivable_other", amount: 3000 },
      ],
      credit: [{ account: "equipment", amount: 5000 }],
    });
    expect(result.feedback).toContain("金額");
  });

  it("alternativesの科目でも金額の説明になる", () => {
    const alternative = { debit: [{ account: "cash", amount: 50000 }], credit: [{ account: "equipment", amount: 50000 }] };
    const result = gradePost({ ...task, alternatives: [alternative] }, entry(5000, 5000, ["cash", "equipment"]));
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("金額");
    expect(result.feedback).not.toContain("何が動くはず");
  });

  it("単元のwrong_patternsが優先される", () => {
    const unbalanced = gradePost(task, entry(5000, 50000));
    expect(unbalanced.feedback).toContain("そろっていません");
    const swapped = gradePost(task, entry(50000, 50000, ["equipment", "accounts_receivable_other"]));
    expect(swapped.feedback).toContain("増えるのは未収入金");
    const misconception = gradePost(task, entry(5000, 5000, ["accounts_receivable", "equipment"]));
    expect(misconception.misconception).toBe("nontrade_as_trade");
  });

  it("科目が違えば金額の説明にしない", () => {
    const result = gradePost(task, entry(5000, 5000, ["cash", "equipment"]));
    expect(result.feedback).toContain("何が動くはず");
  });

  it("余分な科目があるときは金額の説明にしない", () => {
    const result = gradePost(task, { debit: [{ account: "accounts_receivable_other", amount: 5000 }, { account: "cash", amount: 5000 }], credit: [{ account: "equipment", amount: 10000 }] });
    expect(result.feedback).toContain("何が動くはず");
  });
});

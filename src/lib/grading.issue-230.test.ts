import { describe, expect, it } from "vitest";
import type { JournalEntry } from "./accounting";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #230: 減価償却の仕訳で、相手科目を取り違えた誤答に誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const postAt = (unit: string, transaction: string) => {
  const task = unitMap.get(unit)!.steps.map((s) => s.task).find((t) => t.type === "post" && t.transaction.startsWith(transaction));
  if (task?.type !== "post") throw new Error(`post が見つからない: ${transaction}`);
  return task;
};
const entry = (debit: string, credit: string, amount: number): JournalEntry => ({
  debit: [{ account: debit, amount }],
  credit: [{ account: credit, amount }],
});

const tasks = [
  { name: "減価償却とは何か 1 年目", task: postAt("depreciation/what-is-depreciation", "決算にあたり"), amount: 100000, vehicle: false },
  { name: "減価償却とは何か 2 年目", task: postAt("depreciation/what-is-depreciation", "2 年目の決算"), amount: 100000, vehicle: false },
  { name: "定額法 マシン", task: postAt("depreciation/straight-line", "決算にあたり、コーヒーマシン"), amount: 50000, vehicle: true },
];

const wrongs = [
  { name: "減価償却費 / 未払金", debit: "depreciation_expense", credit: "accounts_payable_other", misconception: "expense_as_liability", word: "未払金" },
  { name: "減価償却費 / 買掛金", debit: "depreciation_expense", credit: "accounts_payable", misconception: "expense_as_liability", word: "買掛金" },
  { name: "消耗品費 / 減価償却累計額", debit: "supplies_expense", credit: "accumulated_depreciation", misconception: "depreciation_as_supplies_expense", word: "消耗品費" },
  { name: "備品 / 減価償却累計額", debit: "equipment", credit: "accumulated_depreciation", misconception: "direct_writeoff_vs_contra", word: "備品" },
];

describe.each(tasks)("$name の誤答", ({ task, amount, vehicle }) => {
  it.each(wrongs)("$name に説明と誤解を返す", ({ debit, credit, misconception, word }) => {
    const result = gradePost(task, entry(debit, credit, amount));
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe(misconception);
    expect(result.feedback).toContain(word);
    expect(result.feedback).not.toContain(GENERIC);
  });

  it.runIf(vehicle)("減価償却費 / 車両運搬具 に、マシンの問いだと説明する", () => {
    const result = gradePost(task, entry("depreciation_expense", "vehicle", amount));
    expect(result.misconception).toBe("direct_writeoff_vs_contra");
    expect(result.feedback).toContain("車両運搬具");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("既存のパターンと正解の判定は変わらない", () => {
    expect(gradePost(task, entry("depreciation_expense", "accumulated_depreciation", amount)).correct).toBe(true);
    expect(gradePost(task, entry("accumulated_depreciation", "depreciation_expense", amount)).misconception).toBe("debit_means_increase");
    expect(gradePost(task, entry("depreciation_expense", "equipment", amount)).misconception).toBe("direct_writeoff_vs_contra");
    expect(gradePost(task, entry("depreciation_expense", "cash", amount)).misconception).toBe("depreciation_as_cash_outflow");
  });
});

it("定額法 マシンの月割り忘れは、未払金の説明に奪われない", () => {
  const task = postAt("depreciation/straight-line", "決算にあたり、コーヒーマシン");
  expect(gradePost(task, entry("depreciation_expense", "accumulated_depreciation", 100000)).misconception).toBe("forgot_monthly_proration");
});

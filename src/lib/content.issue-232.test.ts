import { describe, expect, it } from "vitest";
import type { JournalEntry } from "./accounting";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #232: 累計額は資産ごとに分けた科目。備品の減価償却で建物・車両の累計額を書くと正解になっていた
const postAt = (unit: string, transaction: string) => {
  const task = unitMap.get(unit)!.steps.map((s) => s.task).find((t) => t.type === "post" && t.transaction.startsWith(transaction));
  if (task?.type !== "post") throw new Error(`postが見つからない: ${transaction}`);
  return task;
};
const entry = (credit: string, amount: number): JournalEntry => ({
  debit: [{ account: "depreciation_expense", amount }],
  credit: [{ account: credit, amount }],
});

describe.each([
  { name: "減価償却とは何か1年目", task: postAt("depreciation/what-is-depreciation", "決算にあたり"), amount: 100000 },
  { name: "減価償却とは何か2年目", task: postAt("depreciation/what-is-depreciation", "2年目の決算"), amount: 100000 },
  { name: "定額法 マシン", task: postAt("depreciation/straight-line", "決算にあたり、コーヒーマシン"), amount: 50000 },
])("$name(備品)", ({ task, amount }) => {
  it.each(["accumulated_depreciation_equipment", "accumulated_depreciation"])("%sは正解", (credit) => {
    expect(gradePost(task, entry(credit, amount)).correct).toBe(true);
  });

  it.each(["accumulated_depreciation_building", "accumulated_depreciation_vehicle"])("%sは不正解で、資産ごとに積むと説明する", (credit) => {
    const result = gradePost(task, entry(credit, amount));
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("accumulated_depreciation_any_asset");
    expect(result.feedback).toContain("備品減価償却累計額");
  });

  it("総称の累計額で貸借を逆にしても、貸借逆の説明になる", () => {
    const result = gradePost(task, { debit: entry("accumulated_depreciation", amount).credit, credit: entry("accumulated_depreciation", amount).debit });
    expect(result.misconception).toBe("debit_means_increase");
  });
});

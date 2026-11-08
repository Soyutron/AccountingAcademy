import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc } from "./grading";

// Issue #52: 結果ペインの減価償却累計額 150,000(コーヒーマシン分を含む 1 年目末)を引いた値が、汎用文に落ちていた
describe("定額法「2 年目の終わりの価値」", () => {
  const step = unitMap.get("depreciation/straight-line")!.steps.find((s) => s.title === "2 年目の終わりの価値")!;
  if (step.task.type !== "calc") throw new Error("calc ではない");
  const task = step.task;

  it.each([1050000, 850000])("%i には累計額 150,000 がマシン分を含むと説明し、軽バンの 100,000 と 200,000 を示す", (value) => {
    const result = gradeCalc(task, value);
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain("まだ合っていません");
    expect(result.feedback).toContain("150,000");
    expect(result.feedback).toContain("100,000");
    expect(result.feedback).toContain("200,000");
  });
});

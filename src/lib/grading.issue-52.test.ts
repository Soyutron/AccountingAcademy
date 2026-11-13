import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc } from "./grading";

// Issue #52: コーヒーマシンの累計額まで引いた値が、汎用文に落ちていた(#232で累計額は資産ごとの科目になった)
describe("定額法「2年目の終わりの価値」", () => {
  const step = unitMap.get("depreciation/straight-line")!.steps.find((s) => s.title === "2年目の終わりの価値")!;
  if (step.task.type !== "calc") throw new Error("calcではない");
  const task = step.task;

  it.each([1050000, 850000])("%iにはマシンの分まで引いていると説明し、軽バンの100,000と200,000を示す", (value) => {
    const result = gradeCalc(task, value);
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain("まだ合っていません");
    expect(result.feedback).toContain("コーヒーマシンの50,000");
    expect(result.feedback).toContain("100,000");
    expect(result.feedback).toContain("200,000");
  });
});

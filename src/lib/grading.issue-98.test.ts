import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc, type TaskOf } from "./grading";

// Issue #98: 計算問題の定義外の誤答に、仕訳の課題向けの「結果の表で何が動くはずか」が出ていた
const GENERIC = "結果の表で何が動くはずか";

const calcSteps = [...unitMap.values()].flatMap((unit) =>
  unit.steps.flatMap((step, index) => (step.task.type === "calc" ? [{ name: `${unit.id} ステップ ${index + 1}`, task: step.task }] : [])),
);

// 桁違い・符号違い・±1・0 のうち、誤答パターンが定義されていないもの
function undefinedWrongValues(task: TaskOf<"calc">): number[] {
  const values = [task.answer * 10, task.answer / 10, -task.answer, task.answer + 1, task.answer - 1, 0];
  return values.filter((v) => v !== task.answer && !task.wrong_patterns.some((p) => p.match === v));
}

describe("計算問題の定義外の誤答", () => {
  it("calc ステップが走査できている", () => {
    expect(calcSteps.length).toBeGreaterThan(0);
  });

  it.each(calcSteps)("$name: 結果の表の動きを問わず、式と数字の見直しを促す", ({ task }) => {
    for (const value of undefinedWrongValues(task)) {
      const result = gradeCalc(task, value);
      expect(result.correct).toBe(false);
      expect(result.misconception).toBeUndefined();
      expect(result.feedback).not.toContain(GENERIC);
      expect(result.feedback).toContain("式");
    }
  });

  it.each(calcSteps)("$name: 定義済みの誤答には個別の説明と誤解 ID を返す", ({ task }) => {
    for (const pattern of task.wrong_patterns) {
      const result = gradeCalc(task, pattern.match);
      expect(result.correct).toBe(false);
      expect(result.misconception).toBe(pattern.misconception);
      expect(result.feedback).toBe(pattern.feedback);
    }
  });

  it.each(calcSteps)("$name: 正解は正解のまま", ({ task }) => {
    expect(gradeCalc(task, task.answer).correct).toBe(true);
  });
});

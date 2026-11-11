import { describe, expect, it } from "vitest";
import { type Change, ELEMENTS } from "./accounting";
import { unitMap } from "./content";
import { type EffectAnswer, gradePredict, type TaskOf } from "./grading";

// Issue #126: predictは1回限りなのに、定義外の誤答に「もう一度試して」と案内していた
const predictSteps = [...unitMap.values()].flatMap((unit) =>
  unit.steps.flatMap((step, index) => (step.task.type === "predict" ? [{ name: `${unit.id}ステップ${index + 1}`, task: step.task }] : [])),
);

const allAnswers = ELEMENTS.reduce<EffectAnswer[]>(
  (answers, el) => answers.flatMap((a) => (["increase", "decrease", "none"] as Change[]).map((c) => ({ ...a, [el]: c }))),
  [{} as EffectAnswer],
);

function matchedPatterns(task: TaskOf<"predict">, answer: EffectAnswer) {
  return task.wrong_patterns.filter((p) => Object.entries(p.match).every(([k, v]) => v === undefined || answer[k as keyof EffectAnswer] === v));
}

function wrongAnswers(task: TaskOf<"predict">): EffectAnswer[] {
  return allAnswers.filter((a) => !ELEMENTS.every((el) => a[el] === task.answer[el]));
}

describe("predictの誤答の案内", () => {
  it("predictステップが走査できている", () => {
    expect(predictSteps.length).toBeGreaterThan(0);
  });

  it.each(predictSteps)("$name: 定義外の誤答には、やり直しを促さず進めることを伝える", ({ task }) => {
    for (const answer of wrongAnswers(task).filter((a) => matchedPatterns(task, a).length === 0)) {
      const result = gradePredict(task, answer);
      expect(result.correct).toBe(false);
      expect(result.misconception).toBeUndefined();
      expect(result.feedback).not.toContain("もう一度試して");
      expect(result.feedback).toContain("次へ");
    }
  });

  it.each(predictSteps)("$name: 定義済みの誤答には個別の説明を返す", ({ task }) => {
    for (const answer of wrongAnswers(task)) {
      const patterns = matchedPatterns(task, answer);
      if (patterns.length === 0) continue;
      expect(gradePredict(task, answer).feedback).toBe(patterns.map((p) => p.feedback).join("\n"));
    }
  });
});

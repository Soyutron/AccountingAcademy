import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc } from "./grading";

// Issue #23: 「今月の仕入」に損益計算書の累計132,000を答えると、汎用文に落ちていた
describe("返品と運賃「今月の仕入はいくら」", () => {
  it("132,000には先月分を含む合計だと説明する", () => {
    const step = unitMap.get("merchandise/returns-and-costs")!.steps.find((s) => s.title === "今月の仕入はいくら")!;
    if (step.task.type !== "calc") throw new Error("calcではない");
    const result = gradeCalc(step.task, 132000);
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain("まだ合っていません");
    expect(result.feedback).toContain("90,000");
  });
});

import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc } from "./grading";

// Issue #62: 「負債の合計」に貸借対照表の負債・純資産合計1,303,500を答えると、汎用文に落ちていた
describe("商品以外の後払いと手付金「いま負債はいくら」", () => {
  it("1,303,500には負債・純資産合計との取り違えだと説明する", () => {
    const step = unitMap
      .get("receivables-and-payables/other-receivables-and-payables")!
      .steps.find((s) => s.title === "いま負債はいくら")!;
    if (step.task.type !== "calc") throw new Error("calcではない");
    const result = gradeCalc(step.task, 1303500);
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain("まだ合っていません");
    expect(result.feedback).toContain("負債・純資産合計");
    expect(result.feedback).toContain("資本金");
  });
});

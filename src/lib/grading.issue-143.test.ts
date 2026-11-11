import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc } from "./grading";

// Issue #143: 直前の成功文が誘う170,000 − 50,000と、仕入の合計だけの答えに誤答パターンが無かった
const GENERIC = "計算の式と、使う数字";

describe("仕入と売上 ステップ5(商品のもうけ)", () => {
  const task = unitMap.get("merchandise/three-account-method")!.steps[4].task;
  if (task.type !== "calc") throw new Error("calcではない");

  it("120,000には、売上170,000に先月分が入っていると説明する", () => {
    const result = gradeCalc(task, 120000);
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("先月");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("50,000には、仕入の合計だけを答えていると説明する", () => {
    const result = gradeCalc(task, 50000);
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("仕入の合計");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("40,000は正解のまま", () => {
    expect(gradeCalc(task, 40000).correct).toBe(true);
  });
});

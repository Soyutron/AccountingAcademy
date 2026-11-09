import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc } from "./grading";

// Issue #143: 直前の成功文が誘う 170,000 − 50,000 と、仕入の合計だけの答えに誤答パターンが無かった
const GENERIC = "計算の式と、使う数字";

describe("仕入と売上 ステップ 5(商品のもうけ)", () => {
  const task = unitMap.get("merchandise/three-account-method")!.steps[4].task;
  if (task.type !== "calc") throw new Error("calc ではない");

  it("120,000 には、売上 170,000 に先月分が入っていると説明する", () => {
    const result = gradeCalc(task, 120000);
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("先月");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("50,000 には、仕入の合計だけを答えていると説明する", () => {
    const result = gradeCalc(task, 50000);
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("仕入の合計");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("40,000 は正解のまま", () => {
    expect(gradeCalc(task, 40000).correct).toBe(true);
  });
});

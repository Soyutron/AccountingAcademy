import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePredict } from "./grading";

// Issue #188: 商品の仕入で「資産が増える」と予想しても、誤解の判定が無く汎用文だけが出ていた
const GENERIC = "予想と実際の動きが違いました";

const task = () => {
  const t = unitMap.get("merchandise/three-account-method")!.steps[2].task;
  if (t.type !== "predict") throw new Error("predictではない");
  return t;
};

describe("三分法 ステップ3: 資産が増えるという予想", () => {
  it("資産だけ外すと、資産の思い違いの説明と誤解が付く", () => {
    const result = gradePredict(task(), { ...task().answer, asset: "increase" });
    expect(result.correct).toBe(false);
    expect(result.misconceptions).toEqual(["purchase_is_asset"]);
    expect(result.feedback).not.toContain(GENERIC);
    expect(result.feedback).toContain("資産は減ります");
  });

  it("資産以外を「変わらない」にしても、資産の誤りに触れる", () => {
    const result = gradePredict(task(), { asset: "increase", liability: "none", equity: "none", revenue: "none", expense: "none" });
    expect(result.correct).toBe(false);
    expect(result.misconceptions).toEqual(["purchase_is_asset"]);
    expect(result.feedback).toContain("資産は減ります");
    expect(result.feedback).toContain("費用が増えます");
  });
});

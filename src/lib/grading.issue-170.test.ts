import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePredict } from "./grading";

// Issue #170: 5つの要素と仕訳 ステップ3は、まだ定義していない負債・純資産・収益・費用まで予想させていた
const task = () => {
  const t = unitMap.get("bookkeeping-basics/five-elements")!.steps[2].task;
  if (t.type !== "predict") throw new Error("predictではない");
  return t;
};

describe("5つの要素と仕訳 ステップ3: 資産だけを問う予想", () => {
  it("問う要素は資産だけ", () => {
    expect(task().elements).toEqual(["asset"]);
  });

  it("資産だけ選べば正解になる", () => {
    expect(gradePredict(task(), { asset: "none" }).correct).toBe(true);
  });

  it("問わない要素の値は採点に影響しない", () => {
    expect(gradePredict(task(), { asset: "none", liability: "increase", expense: "increase" }).correct).toBe(true);
    const wrong = gradePredict(task(), { asset: "decrease", expense: "increase" });
    expect(wrong.correct).toBe(false);
    expect(wrong.misconceptions).toEqual(["cash_is_only_asset"]);
  });
});

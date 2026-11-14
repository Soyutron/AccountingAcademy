import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc } from "./grading";

// Issue #266: 利息の計算で、年利率2%を0.2と読んだ30,000円と符号を逆にした-3,000円に汎用文だけが出ていた
const GENERIC = "計算の式と、使う数字をもう一度確かめましょう";

const calcTask = () => {
  const t = unitMap.get("receivables-and-payables/loans")!.steps[4].task;
  if (t.type !== "calc") throw new Error("calcではない");
  return t;
};

describe("貸したお金、借りたお金 ステップ5の利息の計算", () => {
  it.each([
    ["年利率を0.2と読んだ30,000円", 30000, "percent_off_by_ten", "0.02"],
    ["符号を逆にした-3,000円", -3000, "expense_as_negative_amount", "符号"],
  ] as const)("%sに、誤解と説明が付く", (_, value, misconception, keyword) => {
    const result = gradeCalc(calcTask(), value);
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain(GENERIC);
    expect(result.misconception).toBe(misconception);
    expect(result.feedback).toContain(keyword);
  });
});

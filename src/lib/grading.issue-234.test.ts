import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc, gradePredict } from "./grading";

// Issue #234: 定額法の月数の数え間違いと「資産が増える」の予想に、汎用文だけが返っていた
const tasks = unitMap.get("depreciation/straight-line")!.steps.map((s) => s.task);
const calc = tasks.find((t) => t.type === "calc" && t.question.includes("初年度"));
const predict = tasks.find((t) => t.type === "predict" && t.transaction.includes("軽バン"));
if (calc?.type !== "calc" || predict?.type !== "predict") throw new Error("課題が見つからない");

describe("初年度の減価償却費の誤答", () => {
  it.each([
    { value: 83333, word: "5か月" },
    { value: 116666, word: "7か月" },
    { value: 116667, word: "7か月" },
  ])("$valueには月数の数え方を返す", ({ value, word }) => {
    const result = gradeCalc(calc, value);
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain(word);
    expect(result.feedback).toContain("両端");
    expect(result.feedback).not.toContain("計算の式と、使う数字");
    expect(result.feedback).not.toContain("100,000");
  });

  it("1100000には帳簿価額を答えていると返す", () => {
    const result = gradeCalc(calc, 1100000);
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("帳簿価額");
    expect(result.feedback).not.toContain("計算の式と、使う数字");
    expect(result.feedback).not.toContain("100,000");
  });
});

describe("減価償却の予想", () => {
  it("資産が増えるの予想に、累計額は資産のマイナスだと誤解ID付きで返す", () => {
    const result = gradePredict(predict, { ...predict.answer, asset: "increase" });
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("資産のマイナス");
    expect(result.feedback).not.toContain("予想と実際の動きが違いました");
    expect(result.misconceptions).toEqual(["contra_increase_as_asset_increase"]);
  });
});

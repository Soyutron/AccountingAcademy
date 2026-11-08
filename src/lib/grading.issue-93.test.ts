import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost, gradePredict } from "./grading";

// Issue #93: 「減価償却とは何か」のよくある誤答に誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const steps = unitMap.get("depreciation/what-is-depreciation")!.steps;
const postTask = (index: number) => {
  const task = steps[index].task;
  if (task.type !== "post") throw new Error("post ではない");
  return task;
};
const predictTask = (index: number) => {
  const task = steps[index].task;
  if (task.type !== "predict") throw new Error("predict ではない");
  return task;
};

describe("2 年目の決算(ステップ 8)", () => {
  const task = postTask(7);

  it("貸方を現金にすると 1 年目と同じ depreciation_as_cash_outflow", () => {
    const entry = {
      debit: [{ account: "depreciation_expense", amount: 100000 }],
      credit: [{ account: "cash", amount: 100000 }],
    };
    const result = gradePost(task, entry);
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("depreciation_as_cash_outflow");
    expect(result.feedback).toBe(gradePost(postTask(4), entry).feedback);
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});

describe("減価償却を記帳する(ステップ 5)", () => {
  const task = postTask(4);

  it("借方を備品にすると費用を立てていないことを指摘する", () => {
    const result = gradePost(task, {
      debit: [{ account: "equipment", amount: 100000 }],
      credit: [{ account: "accumulated_depreciation", amount: 100000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("減価償却費");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("借方が備品でも貸方が現金なら depreciation_as_cash_outflow のまま", () => {
    const result = gradePost(task, {
      debit: [{ account: "equipment", amount: 100000 }],
      credit: [{ account: "cash", amount: 100000 }],
    });
    expect(result.misconception).toBe("depreciation_as_cash_outflow");
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});

describe("電気代を払う(ステップ 2)", () => {
  const task = predictTask(1);

  it("純資産が増えると答えると、費用で純資産が減ることを説明する", () => {
    const result = gradePredict(task, { ...task.answer, equity: "increase" });
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("純資産");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("正解は正解のまま", () => {
    expect(gradePredict(task, task.answer).correct).toBe(true);
  });
});

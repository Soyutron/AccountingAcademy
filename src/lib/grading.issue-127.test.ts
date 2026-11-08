import { describe, expect, it } from "vitest";
import { misconceptionMap, unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #127: 元手の出資を借入金と書く誤答に誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";

function postTask(step: number) {
  const task = unitMap.get("bookkeeping-basics/five-elements")!.steps[step].task;
  if (task?.type !== "post") throw new Error("post ではない");
  return task;
}

describe("5 つの要素と仕訳 ステップ 2(元手をお店に入れる)", () => {
  const task = postTask(1);
  const cash = { account: "cash", amount: 1000000 };

  it("元手を借入金と書くと capital_loan_confused と専用の説明を返す", () => {
    const result = gradePost(task, { debit: [cash], credit: [{ account: "loans_payable", amount: 1000000 }] });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("capital_loan_confused");
    expect(result.feedback).toContain("返す義務");
    expect(result.feedback).toContain("資本金");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("この時点で未定義の「負債」「純資産」を学習者に見せない", () => {
    const result = gradePost(task, { debit: [cash], credit: [{ account: "loans_payable", amount: 1000000 }] });
    const mis = misconceptionMap.get("capital_loan_confused")!;
    for (const text of [result.feedback, mis.name, mis.description, mis.correct]) {
      expect(text).not.toMatch(/負債|純資産/);
    }
  });

  it("既存の 3 パターンの結果は変わらない", () => {
    expect(gradePost(task, { debit: [{ account: "capital_stock", amount: 1000000 }], credit: [cash] }).misconception).toBe("debit_means_increase");
    expect(gradePost(task, { debit: [cash], credit: [{ account: "sales", amount: 1000000 }] }).misconception).toBe("revenue_equals_cash_in");
    const unbalanced = gradePost(task, { debit: [cash], credit: [{ account: "capital_stock", amount: 900000 }] });
    expect(unbalanced.misconception).toBeUndefined();
    expect(unbalanced.feedback).toContain("そろっていません");
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});

describe("5 つの要素と仕訳 ステップ 4(銀行からお金を借りる)", () => {
  it("借入を資本金と書く逆向きの混同にも同じ誤解を返す", () => {
    const task = postTask(3);
    const result = gradePost(task, {
      debit: [{ account: "cash", amount: 300000 }],
      credit: [{ account: "capital_stock", amount: 300000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("capital_loan_confused");
  });
});

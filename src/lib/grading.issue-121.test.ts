import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #121: 売掛金と買掛金の取り違え、買掛金の代わりの未払金に誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";

function postTask(step: number) {
  const task = unitMap.get("merchandise/credit-transactions")!.steps[step].task;
  if (task.type !== "post") throw new Error("postではない");
  return task;
}

describe("問屋から掛けで仕入れる(ステップ2)", () => {
  const task = postTask(1);

  it("右に売掛金と書くとreceivable_payable_confusedで買掛金を示す", () => {
    const result = gradePost(task, {
      debit: [{ account: "purchases", amount: 40000 }],
      credit: [{ account: "accounts_receivable", amount: 40000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("receivable_payable_confused");
    expect(result.feedback).toContain("買掛金");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("右に未払金と書くと、誤解IDなしで商品の代金は買掛金だと示す", () => {
    const result = gradePost(task, {
      debit: [{ account: "purchases", amount: 40000 }],
      credit: [{ account: "accounts_payable_other", amount: 40000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("商品以外");
    expect(result.feedback).toContain("買掛金");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("貸借が合わない誤りは、科目が売掛金でも不一致の説明のまま", () => {
    const result = gradePost(task, {
      debit: [{ account: "purchases", amount: 40000 }],
      credit: [{ account: "accounts_receivable", amount: 30000 }],
    });
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("そろっていません");
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});

describe("月末、代金が振り込まれる(ステップ5)", () => {
  const task = postTask(4);

  it("右に買掛金と書くとreceivable_payable_confusedで売掛金を示す", () => {
    const result = gradePost(task, {
      debit: [{ account: "bank_deposit", amount: 60000 }],
      credit: [{ account: "accounts_payable", amount: 60000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("receivable_payable_confused");
    expect(result.feedback).toContain("売掛金");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});

describe("問屋に代金を払う(ステップ6)", () => {
  const task = postTask(5);

  it("左に売掛金と書くとreceivable_payable_confusedで買掛金を示す", () => {
    const result = gradePost(task, {
      debit: [{ account: "accounts_receivable", amount: 40000 }],
      credit: [{ account: "cash", amount: 40000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("receivable_payable_confused");
    expect(result.feedback).toContain("買掛金");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});

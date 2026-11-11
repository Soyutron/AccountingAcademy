import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #108: 手付金の精算の典型的な誤答に誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";

describe("商品以外の後払いと手付金 ステップ5(商品が届く)", () => {
  const task = unitMap.get("receivables-and-payables/other-receivables-and-payables")!.steps[4].task;
  if (task.type !== "post") throw new Error("postではない");

  it("手付金を差し引かず買掛金を全額にするとadvance_not_cleared_on_receipt", () => {
    const result = gradePost(task, {
      debit: [{ account: "purchases", amount: 40000 }],
      credit: [{ account: "accounts_payable", amount: 40000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("advance_not_cleared_on_receipt");
    expect(result.feedback).toContain("前払金");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("前払金を前受金と取り違えると、受け取った側の科目だと説明する", () => {
    const result = gradePost(task, {
      debit: [{ account: "purchases", amount: 40000 }],
      credit: [
        { account: "advance_received", amount: 10000 },
        { account: "accounts_payable", amount: 30000 },
      ],
    });
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("受け取った側");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("前払金を書いたうえで買掛金も全額にした貸借不一致は、前払金を書くよう促さない", () => {
    const result = gradePost(task, {
      debit: [{ account: "purchases", amount: 40000 }],
      credit: [
        { account: "advance_payment", amount: 10000 },
        { account: "accounts_payable", amount: 40000 },
      ],
    });
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("そろっていません");
  });

  it("仕入を30,000にする誤りはadvance_is_expenseのまま", () => {
    const result = gradePost(task, {
      debit: [{ account: "purchases", amount: 30000 }],
      credit: [{ account: "accounts_payable", amount: 30000 }],
    });
    expect(result.misconception).toBe("advance_is_expense");
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #30: 精算・正体判明のステップの誤答に、前のステップ(仮払い時・正体不明時)の誤解が付いていた
describe("預かったお金、仮のお金", () => {
  const postTask = (title: string) => {
    const step = unitMap.get("receivables-and-payables/temporary-and-deposits")!.steps.find((s) => s.title === title)!;
    if (step.task.type !== "post") throw new Error("post ではない");
    return step.task;
  };

  it("精算で返金を忘れて全額を旅費にすると、精算時の誤解を返す", () => {
    const r = gradePost(postTask("精算する"), {
      debit: [{ account: "travel_expense", amount: 20000 }],
      credit: [{ account: "suspense_payment", amount: 20000 }],
    });
    expect(r.correct).toBe(false);
    expect(r.misconception).toBe("settlement_full_amount_is_expense");
  });

  it("未収入金の回収を売上にすると、回収を売上とする誤解を返す", () => {
    const r = gradePost(postTask("正体が分かった"), {
      debit: [{ account: "suspense_receipt", amount: 50000 }],
      credit: [{ account: "sales", amount: 50000 }],
    });
    expect(r.correct).toBe(false);
    expect(r.misconception).toBe("receivable_collection_is_sale");
  });
});

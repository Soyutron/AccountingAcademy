import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #267: 入金100,000を貸付金98,000と受取利息2,000に分けると、貸付金を減らしているのに「受取利息ではなく貸付金を減らします」と出ていた
describe("貸付金の回収(貸したお金、借りたお金 ステップ6)", () => {
  const unit = unitMap.get("receivables-and-payables/loans")!;
  const task = unit.steps[5].task;
  if (task.type !== "post") throw new Error("postではない");

  it("元本の一部を受取利息に振り分けると、入金はすべて元本だと説明する", () => {
    const result = gradePost(task, {
      debit: [{ account: "bank_deposit", amount: 100000 }],
      credit: [{ account: "loans_receivable", amount: 98000 }, { account: "interest_income", amount: 2000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("repayment_includes_interest");
    expect(result.feedback).not.toContain("受取利息ではなく貸付金を減らします");
    expect(result.feedback).toContain("すべて元本");
  });

  it("貸付金100,000に受取利息を足した仕訳は、利息は別の入金だと説明したまま", () => {
    const result = gradePost(task, {
      debit: [{ account: "bank_deposit", amount: 102000 }],
      credit: [{ account: "loans_receivable", amount: 100000 }, { account: "interest_income", amount: 2000 }],
    });
    expect(result.misconception).toBe("repayment_includes_interest");
    expect(result.feedback).toContain("別の入金");
  });

  it("受取利息だけにした仕訳はprincipal_is_revenueのまま", () => {
    const result = gradePost(task, {
      debit: [{ account: "bank_deposit", amount: 100000 }],
      credit: [{ account: "interest_income", amount: 100000 }],
    });
    expect(result.misconception).toBe("principal_is_revenue");
  });
});

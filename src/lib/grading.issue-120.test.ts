import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #120: 普通預金に振り込まれた取引を、現金の仕訳でも正解にしていた
const task = unitMap.get("merchandise/credit-transactions")!.steps.map((s) => s.task).find((t) => t.type === "post" && t.transaction.includes("普通預金に振り込まれた"));
if (task?.type !== "post") throw new Error("post の課題が見つからない");

const entry = (account: string, amount: number) => ({
  debit: [{ account, amount }],
  credit: [{ account: "accounts_receivable", amount }],
});

describe("普通預金に振り込まれた売掛金の回収", () => {
  it("普通預金なら正解", () => {
    expect(gradePost(task, entry("bank_deposit", 60000)).correct).toBe(true);
  });

  it.each([60000, 6000])("現金 %i は不正解で、預金と現金の誤解として説明する", (amount) => {
    const result = gradePost(task, entry("cash", amount));
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("deposit_is_cash");
    expect(result.feedback).toContain("普通預金");
  });
});

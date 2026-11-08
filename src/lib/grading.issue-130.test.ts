import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #130: 給料の天引きと仮払金の精算の典型的な誤答に誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const unit = unitMap.get("receivables-and-payables/temporary-and-deposits")!;

describe("預かったお金、仮のお金 ステップ 2(給料を払う)", () => {
  const task = unit.steps[1].task;
  if (task.type !== "post") throw new Error("post ではない");
  const salary = { account: "salaries_expense", amount: 100000 };
  const net = { account: "bank_deposit", amount: 97000 };

  it("天引きを忘れて全額を振り込むと withholding_ignored", () => {
    const result = gradePost(task, { debit: [salary], credit: [{ account: "bank_deposit", amount: 100000 }] });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("withholding_ignored");
    expect(result.feedback).toContain("預かっている義務");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("預り金を左に書くと deposit_received_is_asset", () => {
    const result = gradePost(task, {
      debit: [salary, { account: "deposits_received", amount: 3000 }],
      credit: [{ account: "bank_deposit", amount: 103000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("deposit_received_is_asset");
    expect(result.feedback).toContain("負債");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it.each([
    ["advances_paid", "立替金"],
    ["accounts_payable_other", "未払金"],
    ["suspense_receipt", "仮受金"],
  ])("預り金の代わりに %s を使うと、その科目との違いを説明する", (account, name) => {
    const result = gradePost(task, { debit: [salary], credit: [net, { account, amount: 3000 }] });
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain(name);
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("預り金を書いたうえで普通預金も全額にした貸借不一致は、天引き忘れと言わない", () => {
    const result = gradePost(task, {
      debit: [salary],
      credit: [
        { account: "bank_deposit", amount: 100000 },
        { account: "deposits_received", amount: 3000 },
      ],
    });
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("そろっていません");
  });

  it("科目が合っていて金額だけ違う貸借一致は、金額の見直しを促す", () => {
    const result = gradePost(task, {
      debit: [{ account: "salaries_expense", amount: 103000 }],
      credit: [
        { account: "bank_deposit", amount: 100000 },
        { account: "deposits_received", amount: 3000 },
      ],
    });
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("金額");
  });

  it("貸借逆は swapped の説明のまま", () => {
    const result = gradePost(task, { debit: task.answer.credit, credit: task.answer.debit });
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("給料は費用なので左");
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});

describe("預かったお金、仮のお金 ステップ 6(精算する)", () => {
  const task = unit.steps[5].task;
  if (task.type !== "post") throw new Error("post ではない");

  it("仮払金を仮受金と取り違えると、仮受金との違いを説明する", () => {
    const result = gradePost(task, {
      debit: task.answer.debit,
      credit: [{ account: "suspense_receipt", amount: 20000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("仮受金");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("正解は正解のまま", () => {
    expect(gradePost(task, task.answer).correct).toBe(true);
  });
});

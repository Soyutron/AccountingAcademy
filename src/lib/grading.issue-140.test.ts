import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #140: 支払いの書き忘れと、消耗品費・旅費交通費へのまとめに誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const task = unitMap.get("cash-and-deposits/petty-cash")!.steps[3].task;
if (task.type !== "post") throw new Error("postではない");

const stamps = { account: "communication_expense", amount: 4000 };
const stationery = { account: "supplies_expense", amount: 6500 };
const train = { account: "travel_expense", amount: 2000 };
const pettyCash = (amount: number) => [{ account: "petty_cash", amount }];

describe("細かい支払いを任せる ステップ4(週末の報告)", () => {
  it.each([
    ["電車代", [stamps, stationery], 10500],
    ["文房具代", [stamps, train], 6000],
    ["切手代", [stationery, train], 8500],
  ])("%sを書き忘れて貸方をそろえると、抜けた支払いを示す", (name, debit, amount) => {
    const result = gradePost(task, { debit, credit: pettyCash(amount) });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("petty_payment_omitted");
    expect(result.feedback).toContain(name);
    expect(result.feedback).not.toContain(GENERIC);
  });

  it.each([
    ["supplies_expense", "消耗品費"],
    ["travel_expense", "旅費交通費"],
    ["communication_expense", "通信費"],
  ])("3つの支払いを%sにまとめるとpetty_expenses_lumped", (account, name) => {
    const result = gradePost(task, { debit: [{ account, amount: 12500 }], credit: pettyCash(12500) });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("petty_expenses_lumped");
    expect(result.feedback).toContain(name);
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("3行とも書いて金額だけ違うときは、書き忘れと言わない", () => {
    const result = gradePost(task, {
      debit: [stamps, { account: "supplies_expense", amount: 4500 }, train],
      credit: pettyCash(10500),
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("金額");
  });

  it("3行書いて貸方だけ足りないときは、貸借の不一致を示す", () => {
    const result = gradePost(task, { debit: [stamps, stationery, train], credit: pettyCash(10500) });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("そろっていません");
  });
});

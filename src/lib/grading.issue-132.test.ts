import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost } from "./grading";

// Issue #132: 左の「預金」が別名で普通預金に解決され、左右とも普通預金の仕訳が汎用文に落ちていた
describe("小切手で払う「当座預金を開く」", () => {
  const step = unitMap.get("cash-and-deposits/checking-account")!.steps.find((s) => s.title === "当座預金を開く")!;
  if (step.task.type !== "post") throw new Error("post ではない");
  const task = step.task;

  it("左右とも普通預金なら、預金の種類の取り違えだと説明する", () => {
    const result = gradePost(task, {
      debit: [{ account: "bank_deposit", amount: 200000 }],
      credit: [{ account: "bank_deposit", amount: 200000 }],
    });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("deposit_kinds_confused");
    expect(result.feedback).not.toContain("まだ合っていません");
    expect(result.feedback).toContain("当座預金");
    expect(result.feedback).toContain("普通預金");
  });

  it("左右の金額が違うときは、比較表の話ではなく金額の不一致を先に伝える", () => {
    const result = gradePost(task, {
      debit: [{ account: "bank_deposit", amount: 200000 }],
      credit: [{ account: "bank_deposit", amount: 100000 }],
    });
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("そろっていません");
  });
});

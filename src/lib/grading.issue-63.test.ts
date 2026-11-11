import { describe, expect, it } from "vitest";
import { accountMap, unitMap } from "./content";
import { gradePost, gradePredict } from "./grading";

// Issue #63: 不足を雑益へ振り替える誤りと、費用を「減る」とする予想が汎用文に落ちていた
describe("金庫のお金が合わない", () => {
  const task = (title: string) => unitMap.get("cash-and-deposits/cash-over-and-short")!.steps.find((s) => s.title === title)!.task;

  it("原因不明の不足を「現金過不足 / 雑益」にすると、不足と過剰の取り違えだと説明する", () => {
    const t = task("決算で片づける");
    if (t.type !== "post") throw new Error("postではない");
    const r = gradePost(t, {
      debit: [{ account: "cash_over_and_short", amount: 1000 }],
      credit: [{ account: "miscellaneous_gain", amount: 1000 }],
    });
    expect(r.correct).toBe(false);
    expect(r.misconception).toBe("shortage_is_gain");
    expect(r.feedback).toContain("雑損");
    expect(r.feedback).toContain("雑益");
  });

  it("振り替えで費用を「減る」と予想すると、通信費が増えると説明する", () => {
    const t = task("原因が1つ分かった");
    if (t.type !== "predict") throw new Error("predictではない");
    const r = gradePredict(t, { asset: "decrease", liability: "decrease", equity: "decrease", revenue: "decrease", expense: "decrease" });
    expect(r.correct).toBe(false);
    expect(r.feedback).not.toContain("まだ合っていません");
    expect(r.feedback).toContain("通信費");
    expect(r.feedback).toContain("増えます");
  });

  it("「雑損失」を雑損の別名として受け付ける", () => {
    expect(accountMap.get("miscellaneous_loss")!.aliases).toContain("雑損失");
  });
});

import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradeCalc } from "./grading";

// Issue #181: 145,000 は受け取った小切手を当座預金に足した誤答なので、振り出し側の誤解を付けない
describe("当座預金の残高計算の誤答と誤解の対応", () => {
  it("受け取った小切手を足すと、受け取り側の誤解を返す", () => {
    const task = unitMap.get("cash-and-deposits/checking-account")!.steps[5].task;
    if (task?.type !== "calc") throw new Error("calc ではない");
    const r = gradeCalc(task, 145000);
    expect(r.correct).toBe(false);
    expect(r.misconception).toBe("received_check_is_checking_account");
    expect(r.feedback).toContain("受け取った小切手");
  });
});

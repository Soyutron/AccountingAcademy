import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost, gradePredict } from "./grading";

function postTask(unitId: string, index: number) {
  const task = unitMap.get(unitId)!.steps[index].task;
  if (task?.type !== "post") throw new Error("postではない");
  return task;
}

// Issue #80: 「よくある思い込み」は、その誤答から読み取れるものだけを出す
describe("誤答と誤解の対応", () => {
  it("受け取った小切手を当座預金にすると、受け取り側の誤解を返す", () => {
    const r = gradePost(postTask("cash-and-deposits/checking-account", 4), {
      debit: [{ account: "checking_account", amount: 30000 }],
      credit: [{ account: "sales", amount: 30000 }],
    });
    expect(r.correct).toBe(false);
    expect(r.misconception).toBe("received_check_is_checking_account");
    expect(r.feedback).toBeTruthy();
  });

  it("運賃を書かなかった誤答には、運賃を別の費用にする誤解を付けない", () => {
    const r = gradePost(postTask("merchandise/returns-and-costs", 1), {
      debit: [{ account: "purchases", amount: 50000 }],
      credit: [{ account: "accounts_payable", amount: 50000 }],
    });
    expect(r.correct).toBe(false);
    expect(r.misconception).toBeUndefined();
    expect(r.feedback).toBeTruthy();
  });

  it("運賃を発送費に書いた誤答は、運賃を別の費用にする誤解のまま", () => {
    const r = gradePost(postTask("merchandise/returns-and-costs", 1), {
      debit: [
        { account: "purchases", amount: 50000 },
        { account: "shipping_expense", amount: 2000 },
      ],
      credit: [
        { account: "accounts_payable", amount: 50000 },
        { account: "cash", amount: 2000 },
      ],
    });
    expect(r.misconception).toBe("incidental_cost_separate");
  });

  // 商品を資産と考えると、現金と商品の入れ替えで5つとも動かない予想になる
  it("仕入の予想がすべて「変わらない」なら、仕入は資産の誤解のまま", () => {
    const task = unitMap.get("merchandise/three-account-method")!.steps[2].task;
    if (task?.type !== "predict") throw new Error("predictではない");
    const r = gradePredict(task, { asset: "none", liability: "none", equity: "none", revenue: "none", expense: "none" });
    expect(r.misconception).toBe("purchase_is_asset");
  });
});

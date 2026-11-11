import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost, gradePredict, type Task, type TaskOf } from "./grading";

// Issue #229: 振替を逆向きに予想する・振替の相手を現金や売上にする・掛け仕入を現金や未払金にすると、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const PREDICT_GENERIC = "予想と実際の動きが違いました";

const stepTask = (index: number): Task => unitMap.get("merchandise/cost-of-goods-sold")!.steps[index].task;
const predictTask = () => stepTask(2) as TaskOf<"predict">;
const postTask = (index: number) => stepTask(index) as TaskOf<"post">;
const entry = (debit: [string, number], credit: [string, number]) => ({
  debit: [{ account: debit[0], amount: debit[1] }],
  credit: [{ account: credit[0], amount: credit[1] }],
});

describe("売れ残りと売上原価 ステップ3: 振替を逆向きに予想する", () => {
  it("資産 減る・純資産 減る・費用 増えるの予想に、それぞれの説明と誤解が付く", () => {
    const result = gradePredict(predictTask(), { asset: "decrease", liability: "none", equity: "decrease", revenue: "none", expense: "increase" });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("purchases_equal_cogs");
    expect(result.feedback).not.toContain(PREDICT_GENERIC);
    expect(result.feedback).toContain("資産");
    expect(result.feedback).toContain("純資産");
    expect(result.feedback).toContain("費用");
  });

  it("既存の「変わらない」の判定は変わらない", () => {
    const result = gradePredict(predictTask(), { ...predictTask().answer, expense: "none" });
    expect(result.misconception).toBe("purchases_equal_cogs");
    expect(result.feedback).toBe("売れ残りの分は、まだ費用ではありません。仕入(費用)がその分減ります。");
  });

  it("正解は正解のまま", () => {
    expect(gradePredict(predictTask(), predictTask().answer).correct).toBe(true);
  });
});

describe("売れ残りと売上原価 ステップ5: 翌期首の振替", () => {
  const cases: [string, [string, number], [string, number], string][] = [
    ["右に現金", ["purchases", 22000], ["cash", 22000], "お金"],
    ["左に現金", ["cash", 22000], ["merchandise_inventory", 22000], "お金"],
    ["左に売上", ["sales", 22000], ["merchandise_inventory", 22000], "売って"],
  ];
  it.each(cases)("%sは、お金も売上も動かない振替だと説明する", (_name, debit, credit, word) => {
    const result = gradePost(postTask(4), entry(debit, credit));
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("inventory_transfer_as_transaction");
    expect(result.feedback).not.toContain(GENERIC);
    expect(result.feedback).toContain(word);
  });

  it("既存のパターンの判定は変わらない", () => {
    const swapped = gradePost(postTask(4), entry(["merchandise_inventory", 22000], ["purchases", 22000]));
    expect(swapped.feedback).toContain("決算のときの仕訳");
    const sales = gradePost(postTask(4), entry(["purchases", 22000], ["sales", 22000]));
    expect(sales.feedback).toContain("まだ売っていません");
    const unbalanced = gradePost(postTask(4), entry(["purchases", 22000], ["cash", 20000]));
    expect(unbalanced.feedback).toContain("そろっていません");
    expect(gradePost(postTask(4), postTask(4).answer).correct).toBe(true);
  });
});

describe("売れ残りと売上原価 ステップ6: 掛けの仕入", () => {
  it("右に現金を書くと、掛けはまだ払っていないと説明する", () => {
    const result = gradePost(postTask(5), entry(["purchases", 20000], ["cash", 20000]));
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("credit_purchase_paid_in_cash");
    expect(result.feedback).not.toContain(GENERIC);
    expect(result.feedback).toContain("まだ払っていません");
  });

  it("右に未払金を書くとtrade_as_nontrade", () => {
    const result = gradePost(postTask(5), entry(["purchases", 20000], ["accounts_payable_other", 20000]));
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("trade_as_nontrade");
    expect(result.feedback).not.toContain(GENERIC);
    expect(result.feedback).toContain("未払金");
  });

  it("既存のパターンの判定は変わらない", () => {
    const swapped = gradePost(postTask(5), entry(["accounts_payable", 20000], ["purchases", 20000]));
    expect(swapped.misconception).toBe("debit_means_increase");
    const inventory = gradePost(postTask(5), entry(["merchandise_inventory", 20000], ["accounts_payable", 20000]));
    expect(inventory.misconception).toBe("purchase_is_asset");
    const unbalanced = gradePost(postTask(5), entry(["purchases", 20000], ["cash", 10000]));
    expect(unbalanced.feedback).toContain("そろっていません");
    expect(gradePost(postTask(5), postTask(5).answer).correct).toBe(true);
  });
});

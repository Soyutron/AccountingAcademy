import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost, gradePredict, type Task, type TaskOf } from "./grading";

// Issue #229: 振替を逆向きに予想する・振替の相手を現金や売上にする・掛け仕入を現金や未払金にすると、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const PREDICT_GENERIC = "予想と実際の動きが違いました";

const stepTask = (index: number): Task => unitMap.get("merchandise/cost-of-goods-sold")!.steps[index].task;
const predictTask = () => stepTask(3) as TaskOf<"predict">;
const postTask = (index: number) => stepTask(index) as TaskOf<"post">;
const entry = (debit: [string, number], credit: [string, number]) => ({
  debit: [{ account: debit[0], amount: debit[1] }],
  credit: [{ account: credit[0], amount: credit[1] }],
});

describe("売れ残りと売上原価 ステップ4: 振替を逆向きに予想する", () => {
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

describe("売れ残りと売上原価 ステップ3: 期首の商品の振替", () => {
  const cases: [string, [string, number], [string, number], string][] = [
    ["右に現金", ["purchases", 15000], ["cash", 15000], "お金"],
    ["左に現金", ["cash", 15000], ["merchandise_inventory", 15000], "お金"],
    ["左に売上", ["sales", 15000], ["merchandise_inventory", 15000], "取り消す"],
  ];
  it.each(cases)("%sは、お金も売上も動かない振替だと説明する", (_name, debit, credit, word) => {
    const result = gradePost(postTask(2), entry(debit, credit));
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("inventory_transfer_as_transaction");
    expect(result.feedback).not.toContain(GENERIC);
    expect(result.feedback).toContain(word);
  });

  it("既存のパターンの判定は変わらない", () => {
    const swapped = gradePost(postTask(2), entry(["merchandise_inventory", 15000], ["purchases", 15000]));
    expect(swapped.feedback).toContain("売れ残りを取り出すときの向き");
    const sales = gradePost(postTask(2), entry(["purchases", 15000], ["sales", 15000]));
    expect(sales.feedback).toContain("売ったわけではありません");
    const unbalanced = gradePost(postTask(2), entry(["purchases", 15000], ["cash", 10000]));
    expect(unbalanced.feedback).toContain("そろっていません");
    expect(gradePost(postTask(2), postTask(2).answer).correct).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { unitMap } from "./content";
import { gradePost, gradePredict } from "./grading";

// Issue #204: この単元が見分けさせたい科目の取り違えに誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const PREDICT_GENERIC = "予想と実際の動きが違いました";
const unit = unitMap.get("receivables-and-payables/temporary-and-deposits")!;

function postTask(index: number) {
  const task = unit.steps[index].task;
  if (task.type !== "post") throw new Error("postではない");
  return task;
}

describe("預かったお金、仮のお金 ステップ3(預かった税金を納める)", () => {
  const task = unit.steps[2].task;
  if (task.type !== "predict") throw new Error("predictではない");

  it("納付で負債が増えると読むとdeposit_payment_increases_liability", () => {
    const result = gradePredict(task, { asset: "decrease", liability: "increase", equity: "none", revenue: "none", expense: "none" });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("deposit_payment_increases_liability");
    expect(result.feedback).toContain("預り金");
    expect(result.feedback).not.toContain(PREDICT_GENERIC);
  });
});

describe.each([
  [3, "ステップ4(立替金)", 2000, "advance_payment", "前払金", "立替金"],
  [3, "ステップ4(立替金)", 2000, "suspense_payment", "仮払金", "立替金"],
  [4, "ステップ5(仮払金)", 20000, "advance_payment", "前払金", "仮払金"],
  [4, "ステップ5(仮払金)", 20000, "advances_paid", "立替金", "仮払金"],
])("預かったお金、仮のお金%i: %s", (index, _label, amount, account, wrongName, rightName) => {
  it(`${wrongName}と取り違えると、違いを説明する`, () => {
    const result = gradePost(postTask(index), { debit: [{ account, amount }], credit: [{ account: "cash", amount }] });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("prepaid_asset_accounts_confused");
    expect(result.feedback).toContain(wrongName);
    expect(result.feedback).toContain(rightName);
    expect(result.feedback).not.toContain(GENERIC);
  });
});

describe("預かったお金、仮のお金 ステップ8(正体が分かった)", () => {
  const task = postTask(7);
  const debit = [{ account: "suspense_receipt", amount: 50000 }];

  it("未収入金を売掛金と取り違えるとnontrade_as_trade", () => {
    const result = gradePost(task, { debit, credit: [{ account: "accounts_receivable", amount: 50000 }] });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("nontrade_as_trade");
    expect(result.feedback).toContain("未収入金");
    expect(result.feedback).not.toContain(GENERIC);
  });

  it("仮受金を前受金へ移すだけだとsuspense_receipt_moved_to_liability", () => {
    const result = gradePost(task, { debit, credit: [{ account: "advance_received", amount: 50000 }] });
    expect(result.correct).toBe(false);
    expect(result.misconception).toBe("suspense_receipt_moved_to_liability");
    expect(result.feedback).toContain("前受金");
    expect(result.feedback).not.toContain(GENERIC);
  });
});

describe("既存の判定を崩さない", () => {
  it.each([3, 4, 7])("ステップ%iの正解は正解のまま、貸借逆はswappedの説明のまま", (index) => {
    const task = postTask(index);
    expect(gradePost(task, task.answer).correct).toBe(true);
    const swapped = gradePost(task, { debit: task.answer.credit, credit: task.answer.debit });
    expect(swapped.misconception).toBeUndefined();
    expect(swapped.feedback).toContain("右です");
  });
});

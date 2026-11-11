import { describe, expect, it } from "vitest";
import type { EffectAnswer } from "./grading";
import { type TaskOf, gradeCalc, gradeClassify, gradePost, gradePredict } from "./grading";
import { accountMap, unitMap } from "./content";

// Issue #241: 単元の要点に関わる誤答に誤答パターンが無く、汎用文だけが出ていた
const GENERIC = "結果の表で何が動くはずか";
const PREDICT_GENERIC = "予想と実際の動きが違いました";
const CALC_GENERIC = "計算の式と、使う数字";

function task<T extends "post" | "predict" | "calc" | "classify">(step: number, type: T) {
  const t = unitMap.get("merchandise/credit-transactions")!.steps[step].task;
  if (t.type !== type) throw new Error(`${type}ではない`);
  return t as TaskOf<T>;
}

function entry(debit: string, credit: string, amount: number) {
  return { debit: [{ account: debit, amount }], credit: [{ account: credit, amount }] };
}

describe.each([
  { step: 1, debit: "purchases", credit: "sales", amount: 40000, contains: "買掛金", misconception: undefined },
  { step: 3, debit: "checking_account", credit: "accounts_receivable", amount: 60000, contains: "普通預金", misconception: "deposit_kinds_confused" },
  { step: 4, debit: "accounts_payable", credit: "bank_deposit", amount: 40000, contains: "現金", misconception: "deposit_is_cash" },
  { step: 4, debit: "accounts_payable", credit: "accounts_receivable", amount: 40000, contains: "現金", misconception: undefined },
  { step: 4, debit: "accounts_payable", credit: "purchases", amount: 40000, contains: "現金", misconception: undefined },
  { step: 4, debit: "accounts_payable_other", credit: "cash", amount: 40000, contains: "買掛金", misconception: "trade_as_nontrade" },
  { step: 4, debit: "loans_payable", credit: "cash", amount: 40000, contains: "買掛金", misconception: undefined },
])("仕訳 ステップ$step: 左$debit / 右$credit", ({ step, debit, credit, amount, contains, misconception }) => {
  it("なぜ違うかの説明を返す", () => {
    const result = gradePost(task(step, "post"), entry(debit, credit, amount));
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain(GENERIC);
    expect(result.feedback).toContain(contains);
    expect(result.misconception).toBe(misconception);
  });
});

describe("仕訳の既存の判定は変わらない", () => {
  it("貸借が合わなければ、科目が誤答パターンにあっても不一致の説明のまま", () => {
    const result = gradePost(task(4, "post"), {
      debit: [{ account: "accounts_payable", amount: 40000 }],
      credit: [{ account: "bank_deposit", amount: 30000 }],
    });
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("そろっていません");
  });

  it("ステップ2の右の未払金は誤解IDなしのまま(#121)", () => {
    const result = gradePost(task(1, "post"), entry("purchases", "accounts_payable_other", 40000));
    expect(result.misconception).toBeUndefined();
    expect(result.feedback).toContain("商品以外");
  });

  it("ステップ5の左の売掛金はreceivable_payable_confusedのまま(#121)", () => {
    const result = gradePost(task(4, "post"), entry("accounts_receivable", "cash", 40000));
    expect(result.misconception).toBe("receivable_payable_confused");
  });

  it.each([1, 3, 4])("ステップ%iの正解は正解のまま", (step) => {
    const t = task(step, "post");
    expect(gradePost(t, t.answer).correct).toBe(true);
  });
});

describe("会社に掛けで納品する(ステップ3の予想)", () => {
  const t = task(2, "predict");
  const answer = t.answer as EffectAnswer;

  it("資産が減ると予想すると、仕入は記録済みで増えるのは権利だと示す", () => {
    const result = gradePredict(t, { ...answer, asset: "decrease" });
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain(PREDICT_GENERIC);
    expect(result.feedback).toContain("権利");
    expect(result.misconception).toBe("purchase_is_asset");
  });

  it("費用が増えると予想すると、売るときに費用を記録しないと示す", () => {
    const result = gradePredict(t, { ...answer, expense: "increase" });
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain(PREDICT_GENERIC);
    expect(result.feedback).toContain("仕入");
  });

  it("資産が動かないという既存の誤答はreceivable_is_cashのまま", () => {
    expect(gradePredict(t, { ...answer, asset: "none" }).misconception).toBe("receivable_is_cash");
  });

  it("正解は正解のまま", () => {
    expect(gradePredict(t, answer).correct).toBe(true);
  });
});

describe("権利と義務を分ける(ステップ6の分類)", () => {
  const t = task(5, "classify");
  const right = { sales: "revenue", purchases: "expense", bank_deposit: "asset" } as const;

  it("売掛金と買掛金を入れ替えるとreceivable_payable_confusedが付く", () => {
    const result = gradeClassify(t, { ...right, accounts_receivable: "liability", accounts_payable: "asset" }, accountMap);
    expect(result.correct).toBe(false);
    expect(result.misconceptions).toEqual(["receivable_payable_confused"]);
    expect(result.wrong).toHaveLength(2);
  });

  it("売掛金を収益に入れる既存の誤答はreceivable_is_cashのまま", () => {
    const result = gradeClassify(t, { ...right, accounts_receivable: "revenue", accounts_payable: "liability" }, accountMap);
    expect(result.misconceptions).toEqual(["receivable_is_cash"]);
  });
});

describe("ここまでのもうけ(ステップ7の計算)", () => {
  const t = task(6, "calc");

  it.each([
    [140000, "家賃"],
    [20000, "ここまで"],
  ])("%iには、なぜ違うかの説明を返す", (value, contains) => {
    const result = gradeCalc(t, value);
    expect(result.correct).toBe(false);
    expect(result.feedback).not.toContain(CALC_GENERIC);
    expect(result.feedback).toContain(contains);
  });

  it("説明に正解の金額を書かない(#182)", () => {
    for (const value of [140000, 20000]) expect(gradeCalc(t, value).feedback).not.toContain("90,000");
  });

  it("正解は正解のまま", () => {
    expect(gradeCalc(t, t.answer).correct).toBe(true);
  });
});

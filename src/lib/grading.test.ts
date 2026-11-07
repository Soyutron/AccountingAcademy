import { describe, expect, it } from "vitest";
import { computeImpact, type AccountInfo } from "./accounting";
import { buildStatements, computeBalances, diffBalances } from "./ledger";
import { evaluateFormula } from "./formulas";
import { gradeCalc, gradeClassify, gradePost, gradePredict, gradeTweak, type TaskOf } from "./grading";

const accounts = new Map<string, AccountInfo>(
  (
    [
      { id: "cash", name: "現金", aliases: [], element: "asset", contra: false, short: "手元のお金", why: "手元にある財産だから" },
      { id: "building", name: "建物", aliases: [], element: "asset", contra: false, short: "店舗や事務所", why: "長く使える財産だから" },
      { id: "depreciation_expense", name: "減価償却費", aliases: [], element: "expense", contra: false, short: "今年分の目減り", why: "当期に消費した価値だから" },
      { id: "accumulated_depreciation", name: "減価償却累計額", aliases: ["建物減価償却累計額"], element: "asset", contra: true, short: "目減りの累計", why: "資産の控除項目だから" },
      { id: "loans_payable", name: "借入金", aliases: [], element: "liability", contra: false, short: "借りたお金", why: "返す義務だから" },
      { id: "capital_stock", name: "資本金", aliases: [], element: "equity", contra: false, short: "元手", why: "株主が出した元手だから" },
      { id: "sales", name: "売上", aliases: [], element: "revenue", contra: false, short: "売った金額", why: "もうけの元だから" },
    ] as AccountInfo[]
  ).map((a) => [a.id, a]),
);

const post: TaskOf<"post"> = {
  type: "post",
  transaction: "決算整理",
  answer: { debit: [{ account: "depreciation_expense", amount: 100000 }], credit: [{ account: "accumulated_depreciation", amount: 100000 }] },
  alternatives: [],
  wrong_patterns: [
    { match: { swapped: true }, misconception: "debit_means_increase", feedback: "費用は借方です。" },
    { match: { credit: [{ account: "building" }] }, misconception: "direct_writeoff_vs_contra", feedback: "間接法では建物を直接減らしません。" },
    { match: { debit: [{ amount: 1000000 }] }, misconception: "no_cost_allocation", feedback: "1 年分だけを費用にします。" },
    { match: { unbalanced: true }, feedback: "借方と貸方の合計が一致していません。" },
  ],
};

describe("computeImpact", () => {
  it("減価償却の仕訳は資産を減らし費用を増やし、純利益と純資産を減らす", () => {
    const impact = computeImpact(post.answer, accounts);
    expect(impact.asset).toBe(-100000);
    expect(impact.expense).toBe(100000);
    expect(impact.netIncome).toBe(-100000);
    expect(impact.equityTotal).toBe(-100000);
    expect(impact.balanced).toBe(true);
  });
});

describe("gradePost", () => {
  it("行の順序が違っても正解", () => {
    expect(gradePost(post, { debit: [{ account: "depreciation_expense", amount: 100000 }], credit: [{ account: "accumulated_depreciation", amount: 100000 }] }).correct).toBe(true);
  });
  it("貸借が逆なら誤解 debit_means_increase", () => {
    const r = gradePost(post, { debit: [{ account: "accumulated_depreciation", amount: 100000 }], credit: [{ account: "depreciation_expense", amount: 100000 }] });
    expect(r).toMatchObject({ correct: false, misconception: "debit_means_increase" });
  });
  it("建物を直接減らしたら direct_writeoff_vs_contra", () => {
    const r = gradePost(post, { debit: [{ account: "depreciation_expense", amount: 100000 }], credit: [{ account: "building", amount: 100000 }] });
    expect(r.misconception).toBe("direct_writeoff_vs_contra");
  });
  it("どのパターンにも当たらなければ誤解なしの不正解", () => {
    const r = gradePost(post, { debit: [{ account: "cash", amount: 100000 }], credit: [{ account: "accumulated_depreciation", amount: 100000 }] });
    expect(r.correct).toBe(false);
    expect(r.misconception).toBeUndefined();
  });
});

describe("その他の課題", () => {
  it("predict は部分一致の誤答パターンで誤解を返す", () => {
    const task: TaskOf<"predict"> = {
      type: "predict",
      transaction: "減価償却費を計上した",
      entry: post.answer,
      answer: { asset: "decrease", liability: "none", equity: "decrease", revenue: "none", expense: "increase" },
      wrong_patterns: [{ match: { liability: "increase" }, misconception: "contra_as_liability", feedback: "累計額は負債ではありません。" }],
    };
    expect(gradePredict(task, { asset: "none", liability: "increase", equity: "none", revenue: "none", expense: "increase" }).misconception).toBe("contra_as_liability");
    expect(gradePredict(task, task.answer).correct).toBe(true);
  });

  it("calc は値の一致で採点し、既知の誤答値に誤解を付ける", () => {
    const task: TaskOf<"calc"> = { type: "calc", question: "当期の減価償却費は", answer: 60000, wrong_patterns: [{ match: 120000, misconception: "forgot_monthly_proration", feedback: "月割りを忘れています。" }] };
    expect(gradeCalc(task, 60000).correct).toBe(true);
    expect(gradeCalc(task, 120000).misconception).toBe("forgot_monthly_proration");
  });

  it("classify は間違えた科目ごとに理由を返し、誤解を拾う", () => {
    const task: TaskOf<"classify"> = { type: "classify", accounts: ["cash", "loans_payable", "sales"], misconceptions: { loans_payable: { revenue: "revenue_equals_cash_in" } } };
    const r = gradeClassify(task, { cash: "asset", loans_payable: "revenue", sales: "revenue" }, accounts);
    expect(r.correct).toBe(false);
    expect(r.wrong).toHaveLength(1);
    expect(r.wrong[0]).toMatchObject({ account: "loans_payable", misconception: "revenue_equals_cash_in" });
    expect(gradeClassify(task, { cash: "asset", loans_payable: "liability", sales: "revenue" }, accounts).correct).toBe(true);
  });

  it("tweak は式の出力が目標と一致したら正解", () => {
    const task: TaskOf<"tweak"> = {
      type: "tweak",
      formula: "straight_line",
      params: [{ id: "cost", label: "取得原価", value: 1200000, min: 0, max: 2000000, step: 100000, unit: "円" }],
      goal: { output: "annual_depreciation", equals: 150000, label: "1 年分の減価償却費" },
    };
    const outputs = evaluateFormula("straight_line", { cost: 1200000, residual_value: 0, useful_life: 8 }).outputs;
    expect(outputs.annual_depreciation).toBe(150000);
    expect(gradeTweak(task, outputs).correct).toBe(true);
    expect(gradeTweak(task, { annual_depreciation: 200000 }).correct).toBe(false);
  });
});

describe("ledger", () => {
  it("開始残高と記帳から貸借対照表と損益計算書を組み立て、差分を出す", () => {
    const opening = [
      { account: "cash", amount: 1000000 },
      { account: "capital_stock", amount: 1000000 },
    ];
    const before = computeBalances(opening, [], accounts);
    const after = computeBalances(
      opening,
      [
        { debit: [{ account: "cash", amount: 300000 }], credit: [{ account: "loans_payable", amount: 300000 }] },
        { debit: [{ account: "cash", amount: 80000 }], credit: [{ account: "sales", amount: 80000 }] },
        post.answer,
      ],
      accounts,
    );
    const st = buildStatements(after, accounts);
    expect(st.totalAssets).toBe(1000000 + 300000 + 80000 - 100000);
    expect(st.totalLiabilities).toBe(300000);
    expect(st.netIncome).toBe(80000 - 100000);
    expect(st.totalEquity).toBe(1000000 + st.netIncome);
    expect(st.totalAssets).toBe(st.totalLiabilities + st.totalEquity);
    expect(st.assets.find((l) => l.account === "accumulated_depreciation")?.amount).toBe(-100000);
    const diff = diffBalances(before, after);
    expect(diff.get("cash")).toBe(380000);
    expect(diff.get("capital_stock")).toBeUndefined();
  });
});

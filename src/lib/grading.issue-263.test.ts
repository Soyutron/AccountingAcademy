import { describe, expect, it } from "vitest";
import { unitAccountList, unitMap } from "./content";
import { gradeDebug, type TaskOf } from "./grading";
import { buildTrialBalance } from "./ledger";

// Issue #263: バグ探し(debug)。誤りの行を選び、仕訳を直して確認する
const venture = unitMap.get("birth-of-double-entry/venture-profit-and-double-entry")!;
const accounts = new Map(unitAccountList(venture.scenario.accounts).map((a) => [a.id, a]));
const task = venture.steps[5].task as TaskOf<"debug">;

describe("単元2ステップ6「写し忘れを見つける」", () => {
  it("debugの課題で、answerで正解になる", () => {
    expect(task.type).toBe("debug");
    expect(gradeDebug(task, task.answer, accounts)).toEqual({ correct: true, feedback: task.success });
  });

  it("貸方の行を先に書いた同じ仕訳も正解", () => {
    const entry = { debit: [{ account: "giovanni", amount: 50 }], credit: [{ account: "wine_voyage", amount: 50 }] };
    expect(gradeDebug(task, { index: 2, entry }, accounts).correct).toBe(true);
  });

  it("両側そろった行を選ぶと、wrong_patternsの文言が返る", () => {
    const r = gradeDebug(task, { index: 4, entry: task.entries[4] }, accounts);
    expect(r.correct).toBe(false);
    expect(r.feedback).toBe(task.wrong_patterns.find((p) => p.match.index === 4)!.feedback);
  });

  it("パターンの無い行を選ぶと、両側そろっているという既定の文言が返る", () => {
    const r = gradeDebug(task, { index: 1, entry: task.entries[1] }, accounts);
    expect(r).toEqual({ correct: false, misconception: undefined, feedback: expect.stringContaining("両側がそろっています") });
  });

  it("行は合っているが金額が違えば、postと同じく金額の見直しを促す", () => {
    const entry = { debit: [{ account: "giovanni", amount: 50 }], credit: [{ account: "wine_voyage", amount: 45 }] };
    const r = gradeDebug(task, { index: 2, entry }, accounts);
    expect(r.correct).toBe(false);
    expect(r.feedback).toBe("科目は合っています。金額をもう一度確かめましょう。");
  });

  it("行は合っているが相手の科目が違えば、正解にならない", () => {
    const entry = { debit: [{ account: "giovanni", amount: 50 }], credit: [{ account: "cash", amount: 50 }] };
    expect(gradeDebug(task, { index: 2, entry }, accounts).correct).toBe(false);
  });

  it("entriesのままでは試算の左右が合わず、正解の行に置き換えるとそろう", () => {
    const opening = venture.scenario.opening;
    const before = buildTrialBalance(opening, task.entries, accounts);
    expect(before.debit - before.credit).toBe(50);
    const fixed = task.entries.map((e, i) => (i === task.answer.index ? task.answer.entry : e));
    const after = buildTrialBalance(opening, fixed, accounts);
    expect(after.debit).toBe(after.credit);
  });
});

describe("行の選び間違いの誤解", () => {
  const t: TaskOf<"debug"> = {
    type: "debug",
    entries: [
      { debit: [{ account: "cash", amount: 10 }], credit: [{ account: "sales", amount: 10 }] },
      { debit: [{ account: "cash", amount: 20 }], credit: [] },
    ],
    answer: { index: 1, entry: { debit: [{ account: "cash", amount: 20 }], credit: [{ account: "sales", amount: 20 }] } },
    wrong_patterns: [{ match: { index: 0 }, misconception: "revenue_equals_cash_in", feedback: "この行は両側に10があります。" }],
  };

  it("wrong_patternsに誤解があれば、誤解IDも返す", () => {
    expect(gradeDebug(t, { index: 0, entry: t.entries[0] })).toEqual({ correct: false, misconception: "revenue_equals_cash_in", feedback: "この行は両側に10があります。" });
  });

  it("successが無ければ既定の文言で正解", () => {
    expect(gradeDebug(t, t.answer)).toEqual({ correct: true, feedback: "できました。" });
  });
});

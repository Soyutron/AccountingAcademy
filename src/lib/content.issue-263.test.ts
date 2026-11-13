import { describe, expect, it } from "vitest";
import { debugErrors } from "./content-checks";

// Issue #263: debugの検査。誤りの行は1つだけで、answer.indexと一致する
const balanced = { debit: [{ amount: 80 }], credit: [{ amount: 80 }] };
const missing = { debit: [{ amount: 50 }], credit: [] };
const fixed = { debit: [{ amount: 50 }], credit: [{ amount: 50 }] };
const task = { entries: [balanced, missing, balanced], answer: { index: 1, entry: fixed }, wrong_patterns: [{ match: { index: 0 } }] };

describe("debugの検査", () => {
  it("正しい形は通る", () => {
    expect(debugErrors(task)).toEqual([]);
  });

  it("貸借が合わない行が無い、または2つ以上なら拒否する", () => {
    expect(debugErrors({ ...task, entries: [balanced, balanced, balanced] })).toEqual(["entriesの貸借が合わない行が0個ある(1個にする)"]);
    expect(debugErrors({ ...task, entries: [missing, missing, balanced], wrong_patterns: [] })).toEqual(["entriesの貸借が合わない行が2個ある(1個にする)"]);
  });

  it("貸借が合わない行とanswer.indexが違えば拒否する", () => {
    expect(debugErrors({ ...task, answer: { index: 2, entry: fixed } })).toEqual(["貸借が合わない行1がanswer.index 2と違う"]);
  });

  it("answer.indexとwrong_patternsのindexがentriesの範囲外なら拒否する", () => {
    expect(debugErrors({ ...task, answer: { index: 3, entry: fixed } })).toEqual(["answer.index 3がentriesの範囲外"]);
    expect(debugErrors({ ...task, wrong_patterns: [{ match: { index: 5 } }] })).toEqual(["wrong_patternsのindex 5がentriesの範囲外"]);
  });

  it("wrong_patternsのindexが正解の行なら拒否する", () => {
    expect(debugErrors({ ...task, wrong_patterns: [{ match: { index: 1 } }] })).toEqual(["wrong_patternsのindex 1がanswer.indexと同じ"]);
  });

  it("answer.entryの貸借が合わなければ拒否する", () => {
    expect(debugErrors({ ...task, answer: { index: 1, entry: missing } })).toEqual(["answer.entryの借方合計と貸方合計が一致しない"]);
  });
});

import { describe, expect, it } from "vitest";
import { evaluateFormula } from "./formulas";

// Issue #9: months を渡していない tweak(定額法 ステップ 3・4)で、当期分が 12 か月で計算されて表示されていた
describe("straight_line", () => {
  it("months が無ければ 1 年分だけを出す", () => {
    const r = evaluateFormula("straight_line", { cost: 1200000, residual_value: 0, useful_life: 6 });
    expect(r.outputs).toEqual({ annual_depreciation: 200000 });
    expect(Object.keys(r.labels)).toEqual(["annual_depreciation"]);
  });
  it("months があれば月割りの当期分と期末の帳簿価額を出す", () => {
    const r = evaluateFormula("straight_line", { cost: 1200000, residual_value: 0, useful_life: 6, months: 6 });
    expect(r.outputs).toEqual({ annual_depreciation: 200000, period_depreciation: 100000, book_value_end: 1100000 });
  });
});

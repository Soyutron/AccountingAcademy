// 「条件を変える」ステップで使う計算式。コンテンツは式 ID とパラメータだけを持ち、計算はここで行う

export type FormulaId = "straight_line";

export interface FormulaResult {
  outputs: Record<string, number>;
  labels: Record<string, string>;
}

const FORMULAS: Record<FormulaId, (params: Record<string, number>) => FormulaResult> = {
  // 定額法: 年間償却額 = (取得原価 − 残存価額) ÷ 耐用年数。months があれば月割り
  straight_line: ({ cost = 0, residual_value = 0, useful_life = 1, months = 12 }) => {
    const annual = useful_life > 0 ? Math.floor((cost - residual_value) / useful_life) : 0;
    const period = Math.floor((annual * months) / 12);
    return {
      outputs: { annual_depreciation: annual, period_depreciation: period, book_value_end: cost - period },
      labels: { annual_depreciation: "1 年分の減価償却費", period_depreciation: "当期の減価償却費", book_value_end: "期末の帳簿価額" },
    };
  },
};

export function evaluateFormula(id: FormulaId, params: Record<string, number>): FormulaResult {
  return FORMULAS[id](params);
}

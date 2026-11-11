import { type AccountInfo, type Element, type JournalEntry, increaseSide } from "./accounting";

// 帳簿(記帳済みの仕訳)から残高と財務諸表を組み立てる純粋関数。結果ペインと差分表示が使う

/** 科目ごとの残高。正の値 = その科目が本来増える側に残高がある(資産なら借方残高) */
export type Balances = Map<string, number>;

export interface OpeningLine {
  account: string;
  amount: number;
}

export function computeBalances(opening: OpeningLine[], entries: JournalEntry[], accounts: ReadonlyMap<string, AccountInfo>): Balances {
  const balances: Balances = new Map();
  const add = (id: string, delta: number) => balances.set(id, (balances.get(id) ?? 0) + delta);
  for (const l of opening) add(l.account, l.amount);
  for (const e of entries) {
    for (const l of e.debit) {
      const a = accounts.get(l.account);
      if (a) add(l.account, increaseSide(a.element) === "debit" ? l.amount : -l.amount);
    }
    for (const l of e.credit) {
      const a = accounts.get(l.account);
      if (a) add(l.account, increaseSide(a.element) === "credit" ? l.amount : -l.amount);
    }
  }
  return balances;
}

export interface StatementLine {
  account: string;
  name: string;
  amount: number;
  contra: boolean;
}

export interface Statements {
  assets: StatementLine[];
  liabilities: StatementLine[];
  equity: StatementLine[];
  revenues: StatementLine[];
  expenses: StatementLine[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number; // 当期純利益を含む
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
}

/** 残高を貸借対照表と損益計算書の形に並べる。残高ゼロの科目は出さない。評価勘定は資産の中にマイナス表示 */
export function buildStatements(balances: Balances, accounts: ReadonlyMap<string, AccountInfo>): Statements {
  const groups: Record<Element, StatementLine[]> = { asset: [], liability: [], equity: [], revenue: [], expense: [] };
  // 行順は残高の現れた順ではなくマスタの順(資産・負債は流動性配列)。記帳や期首残高の順で表の形を変えない
  for (const [id, a] of accounts) {
    const amount = balances.get(id);
    if (!amount) continue;
    // 残高は「要素が増える側」を正としているので、評価勘定は自然に負の値(控除)として並ぶ
    groups[a.element].push({ account: id, name: a.name, amount, contra: a.contra });
  }
  const total = (lines: StatementLine[]) => lines.reduce((t, l) => t + l.amount, 0);
  const totalRevenue = total(groups.revenue);
  const totalExpense = total(groups.expense);
  const netIncome = totalRevenue - totalExpense;
  return {
    assets: groups.asset,
    liabilities: groups.liability,
    equity: groups.equity,
    revenues: groups.revenue,
    expenses: groups.expense,
    totalAssets: total(groups.asset),
    totalLiabilities: total(groups.liability),
    totalEquity: total(groups.equity) + netIncome,
    totalRevenue,
    totalExpense,
    netIncome,
  };
}

/** 2つの残高の差分(科目 → 増減額)。変わらない科目は含めない */
export function diffBalances(before: Balances, after: Balances): Map<string, number> {
  const diff = new Map<string, number>();
  const ids = new Set([...before.keys(), ...after.keys()]);
  for (const id of ids) {
    const d = (after.get(id) ?? 0) - (before.get(id) ?? 0);
    if (d !== 0) diff.set(id, d);
  }
  return diff;
}

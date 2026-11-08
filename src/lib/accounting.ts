// 会計の基本的な計算(純粋関数)。採点エンジンと仕訳エディタの影響表示が共有する

export type Element = "asset" | "liability" | "equity" | "revenue" | "expense";
export type Change = "increase" | "decrease" | "none";
export type Side = "debit" | "credit";

export interface AccountInfo {
  id: string;
  name: string;
  aliases: string[];
  // 候補検索だけで引く読み(ひらがな)。科目名としては確定させない
  reading?: string[];
  element: Element;
  contra: boolean;
  // 一文の説明と、なぜその要素に属するか。ホバー解説と要素分類のフィードバックに使う
  short: string;
  why: string;
  // 用語集とポップオーバーの「例:」
  example?: string;
}

export interface JournalLine {
  account: string;
  amount: number;
}

export interface JournalEntry {
  debit: JournalLine[];
  credit: JournalLine[];
}

export const ELEMENT_LABELS: Record<Element, string> = {
  asset: "資産",
  liability: "負債",
  equity: "純資産",
  revenue: "収益",
  expense: "費用",
};

// why は「なぜその要素か」の答えなので、問いが読めるように見出しを付けて用語の説明にする
export function accountSummary(account: Pick<AccountInfo, "element" | "why">): string {
  return `${ELEMENT_LABELS[account.element]}に分類する理由: ${account.why}`;
}

export const ELEMENTS: Element[] = ["asset", "liability", "equity", "revenue", "expense"];

// 借方で増える要素。それ以外は貸方で増える
const DEBIT_INCREASES: ReadonlySet<Element> = new Set(["asset", "expense"]);

/** その要素が増える側 */
export function increaseSide(element: Element): Side {
  return DEBIT_INCREASES.has(element) ? "debit" : "credit";
}

/** その科目自体が増える側。評価勘定(減価償却累計額など)は要素と逆の側で増える */
export function accountIncreaseSide(account: Pick<AccountInfo, "element" | "contra">): Side {
  const side = increaseSide(account.element);
  if (!account.contra) return side;
  return side === "debit" ? "credit" : "debit";
}

/**
 * 1 行の仕訳が、その科目の属する要素をいくら増減させるか。
 * 評価勘定(減価償却累計額など)は「科目自体」は貸方で増えるが、「要素(資産)」は減るので、要素への影響は通常の科目と同じ式になる
 */
export function lineEffect(account: AccountInfo, side: Side, amount: number): number {
  return (increaseSide(account.element) === side ? 1 : -1) * amount;
}

export interface Impact {
  asset: number;
  liability: number;
  equity: number;
  revenue: number;
  expense: number;
  netIncome: number;
  // 純資産の変化(直接の増減 + 当期純利益)。演習の「純資産」はこの定義で問う
  equityTotal: number;
  debitTotal: number;
  creditTotal: number;
  balanced: boolean;
}

/** 仕訳が 5 要素と当期純利益に与える影響。未知の科目の行は無視する */
export function computeImpact(entry: JournalEntry, accounts: ReadonlyMap<string, AccountInfo>): Impact {
  const impact = { asset: 0, liability: 0, equity: 0, revenue: 0, expense: 0 };
  const apply = (lines: JournalLine[], side: Side) => {
    for (const line of lines) {
      const account = accounts.get(line.account);
      if (!account) continue;
      impact[account.element] += lineEffect(account, side, line.amount);
    }
  };
  apply(entry.debit, "debit");
  apply(entry.credit, "credit");
  const sum = (lines: JournalLine[]) => lines.reduce((t, l) => t + l.amount, 0);
  const debitTotal = sum(entry.debit);
  const creditTotal = sum(entry.credit);
  const netIncome = impact.revenue - impact.expense;
  return {
    ...impact,
    netIncome,
    equityTotal: impact.equity + netIncome,
    debitTotal,
    creditTotal,
    balanced: debitTotal === creditTotal && debitTotal > 0,
  };
}

export function toChange(delta: number): Change {
  if (delta > 0) return "increase";
  if (delta < 0) return "decrease";
  return "none";
}

/** 科目名・別名から勘定科目を引く。前後の空白は無視する */
export function findAccountByName(name: string, accounts: Iterable<AccountInfo>): AccountInfo | undefined {
  const needle = name.trim();
  if (!needle) return undefined;
  for (const account of accounts) {
    if (account.name === needle || account.aliases.includes(needle)) return account;
  }
  return undefined;
}

export const toHiragana = (text: string) => text.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

/** 入力途中の文字が科目名・別名・読みのどこかに部分一致するか。カタカナはひらがなとして比べる */
export function matchesAccountQuery(account: AccountInfo, query: string): boolean {
  const q = toHiragana(query.trim());
  return [account.name, ...account.aliases, ...(account.reading ?? [])].some((text) => toHiragana(text).includes(q));
}

/** 行の順序と分け方を無視して、科目ごとの金額が同じ仕訳か(同じ科目の行は合算して比べる) */
export function sameEntry(a: JournalEntry, b: JournalEntry): boolean {
  const key = (lines: JournalLine[]) => {
    const totals = new Map<string, number>();
    for (const l of lines) totals.set(l.account, (totals.get(l.account) ?? 0) + l.amount);
    return [...totals]
      .map(([account, amount]) => `${account}:${amount}`)
      .sort()
      .join(",");
  };
  return key(a.debit) === key(b.debit) && key(a.credit) === key(b.credit);
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString("ja-JP");
}

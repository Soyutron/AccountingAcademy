import { describe, expect, it } from "vitest";
import type { JournalEntry } from "./accounting";
import { accountMap } from "./content";
import { buildStatements, computeBalances, type OpeningLine } from "./ledger";

// Issue #123: 貸借対照表の行は、残高の現れた順ではなく流動性の順(勘定科目マスタの順)に並ぶ
const entry = (account: string, against: string, amount: number): JournalEntry => ({
  debit: [{ account, amount }],
  credit: [{ account: against, amount }],
});
const statementsOf = (opening: OpeningLine[], entries: JournalEntry[]) => buildStatements(computeBalances(opening, entries, accountMap), accountMap);
const ids = (lines: { account: string }[]) => lines.map((l) => l.account);

const opening: OpeningLine[] = [
  { account: "cash", amount: 500000 },
  { account: "equipment", amount: 600000 },
  { account: "loans_payable", amount: 300000 },
  { account: "capital_stock", amount: 800000 },
];
const entries = [entry("purchases", "accounts_payable", 40000), entry("accounts_receivable", "sales", 90000), entry("bank_deposit", "accounts_receivable", 60000)];

describe("貸借対照表の行順", () => {
  it("記帳で後から現れた科目も流動性の順に入る", () => {
    const st = statementsOf(opening, entries);
    expect(ids(st.assets)).toEqual(["cash", "bank_deposit", "accounts_receivable", "equipment"]);
    expect(ids(st.liabilities)).toEqual(["accounts_payable", "loans_payable"]);
  });

  it("期首残高の記述順を入れ替えても同じ順になる", () => {
    const st = statementsOf([...opening].reverse(), entries);
    expect(ids(st.assets)).toEqual(["cash", "bank_deposit", "accounts_receivable", "equipment"]);
    expect(ids(st.liabilities)).toEqual(["accounts_payable", "loans_payable"]);
  });

  it("資産・負債の全科目が流動性配列で、評価勘定は固定資産の直後に並ぶ", () => {
    const of = (element: string) => [...accountMap.values()].filter((a) => a.element === element).map((a) => a.id);
    expect(of("asset")).toEqual([
      "cash",
      "petty_cash",
      "cash_over_and_short",
      "checking_account",
      "bank_deposit",
      "accounts_receivable",
      "merchandise_inventory",
      "loans_receivable",
      "accounts_receivable_other",
      "advance_payment",
      "advances_paid",
      "suspense_payment",
      "building",
      "equipment",
      "vehicle",
      "accumulated_depreciation",
    ]);
    expect(of("liability")).toEqual(["accounts_payable", "accounts_payable_other", "advance_received", "deposits_received", "suspense_receipt", "bank_overdraft", "loans_payable"]);
  });
});

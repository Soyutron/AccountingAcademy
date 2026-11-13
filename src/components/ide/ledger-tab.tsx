"use client";

import { type AccountInfo, type JournalEntry, accountIncreaseSide, formatAmount } from "@/lib/accounting";
import { type OpeningLine, buildTrialBalance } from "@/lib/ledger";
import { TAccountFigure } from "@/components/figures/taccount-figure";

// 総勘定元帳タブ。開始残高と記帳済みの仕訳から、科目ごとのT勘定を組み立てる

interface Posted {
  memo: string;
  entry: JournalEntry;
}

export function LedgerTab({ opening, posted, accounts }: { opening: OpeningLine[]; posted: Posted[]; accounts: ReadonlyMap<string, AccountInfo> }) {
  const lines = new Map<string, { debit: { label: string; amount: number }[]; credit: { label: string; amount: number }[] }>();
  const of = (id: string) => {
    if (!lines.has(id)) lines.set(id, { debit: [], credit: [] });
    return lines.get(id)!;
  };
  for (const o of opening) {
    const a = accounts.get(o.account);
    if (a) of(o.account)[accountIncreaseSide(a)].push({ label: "開始残高", amount: o.amount });
  }
  for (const p of posted) {
    p.entry.debit.forEach((l) => of(l.account).debit.push({ label: p.memo, amount: l.amount }));
    p.entry.credit.forEach((l) => of(l.account).credit.push({ label: p.memo, amount: l.amount }));
  }
  const ids = [...lines.keys()].filter((id) => accounts.has(id));
  if (ids.length === 0) return <p className="text-xs text-muted-foreground">まだ記帳がありません。記帳すると科目ごとのT勘定がここに並びます。</p>;
  return (
    // grid-cols-1(minmax(0, 1fr))がないと、暗黙のauto列がT勘定の中身の幅まで広がる
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ids.map((id) => {
        const t = lines.get(id)!;
        return <TAccountFigure key={id} account={accounts.get(id)!} debit={t.debit} credit={t.credit} />;
      })}
    </div>
  );
}

/** 試算(合計試算表)。scenario.view: ledgerの結果ペインで、全科目の左右の合計が一致するかを見せる */
export function TrialBalanceTable({ opening, posted, accounts }: { opening: OpeningLine[]; posted: Posted[]; accounts: ReadonlyMap<string, AccountInfo> }) {
  const tb = buildTrialBalance(opening, posted.map((p) => p.entry), accounts);
  if (tb.lines.length === 0) return <p className="text-xs text-muted-foreground">まだ記帳がありません。</p>;
  const balanced = tb.debit === tb.credit;
  return (
    <div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="px-1 text-left font-medium">科目</th>
            <th className="px-1 text-right font-medium">借方合計</th>
            <th className="px-1 text-right font-medium">貸方合計</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {tb.lines.map((l) => (
            <tr key={l.account}>
              <td className="px-1 font-sans">{l.name}</td>
              <td className="px-1 text-right">{formatAmount(l.debit)}</td>
              <td className="px-1 text-right">{formatAmount(l.credit)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="font-mono tabular-nums font-medium">
          <tr className="border-t border-foreground/60">
            <td className="px-1 font-sans">合計</td>
            <td className="px-1 text-right">{formatAmount(tb.debit)}</td>
            <td className="px-1 text-right">{formatAmount(tb.credit)}</td>
          </tr>
        </tfoot>
      </table>
      <p className={`mt-1 text-xs ${balanced ? "text-muted-foreground" : "text-error-fg"}`}>{balanced ? "左右の合計は一致しています。" : "左右の合計が一致していません。"}</p>
    </div>
  );
}

"use client";

import { type AccountInfo, type JournalEntry, accountIncreaseSide } from "@/lib/accounting";
import type { OpeningLine } from "@/lib/ledger";
import { TAccountFigure } from "@/components/figures/taccount-figure";

// 総勘定元帳タブ。開始残高と記帳済みの仕訳から、科目ごとの T 勘定を組み立てる

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
  if (ids.length === 0) return <p className="text-xs text-muted-foreground">まだ記帳がありません。記帳すると科目ごとの T 勘定がここに並びます。</p>;
  return (
    // grid-cols-1(minmax(0, 1fr))がないと、暗黙の auto 列が T 勘定の中身の幅まで広がる
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ids.map((id) => {
        const t = lines.get(id)!;
        return <TAccountFigure key={id} account={accounts.get(id)!} debit={t.debit} credit={t.credit} />;
      })}
    </div>
  );
}

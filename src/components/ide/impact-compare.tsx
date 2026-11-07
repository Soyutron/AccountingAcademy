"use client";

import { type AccountInfo, type JournalEntry, ELEMENTS, computeImpact, formatAmount } from "@/lib/accounting";
import { ElementBadge } from "@/components/element-badge";

// 不正解のとき、学習者の仕訳の影響と期待される影響を 5 要素で並べる(docs/ide-design.md 3 章「誤りの見せ方」)

export function ImpactCompare({ yours, expected, accounts }: { yours: JournalEntry; expected: JournalEntry; accounts: ReadonlyMap<string, AccountInfo> }) {
  const a = computeImpact(yours, accounts);
  const b = computeImpact(expected, accounts);
  const value = (impact: typeof a, el: (typeof ELEMENTS)[number]) => (el === "equity" ? impact.equityTotal : impact[el]);
  const fmt = (n: number) => (n > 0 ? `+${formatAmount(n)}` : n < 0 ? `−${formatAmount(-n)}` : "±0");
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-muted-foreground">
          <th scope="col" className="text-left font-normal">要素</th>
          <th scope="col" className="text-right font-normal">あなたの仕訳</th>
          <th scope="col" className="text-right font-normal">期待される動き</th>
        </tr>
      </thead>
      <tbody>
        {ELEMENTS.map((el) => {
          const ya = value(a, el);
          const ex = value(b, el);
          const differs = ya !== ex;
          return (
            <tr key={el} className={differs ? "bg-rose-50 font-medium" : ""}>
              <td className="py-0.5"><ElementBadge element={el} size="xs" /></td>
              <td className="text-right tabular-nums">{fmt(ya)}</td>
              <td className="text-right tabular-nums">{differs ? fmt(ex) : "同じ"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

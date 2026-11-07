"use client";

import { type AccountInfo, type Element, ELEMENT_LABELS, ELEMENTS, formatAmount } from "@/lib/accounting";
import { type Balances, type StatementLine, buildStatements } from "@/lib/ledger";

// 結果ペイン: 貸借対照表と損益計算書。前のステップからの差分を ▲▼ で示す(docs/ide-design.md 2 章)

interface Props {
  accounts: ReadonlyMap<string, AccountInfo>;
  balances: Balances;
  // 現在のステップで動いた科目 → 増減額(要素が増える側を正とする)
  diff: Map<string, number>;
  company: string;
}

export function StatementsPane({ accounts, balances, diff, company }: Props) {
  const st = buildStatements(balances, accounts);
  const balanced = st.totalAssets === st.totalLiabilities + st.totalEquity;
  const changedElements = new Map<Element, number>();
  for (const [id, d] of diff) {
    const a = accounts.get(id);
    if (a) changedElements.set(a.element, (changedElements.get(a.element) ?? 0) + d);
  }
  // 資産の中で入れ替わっただけ(差し引きゼロ)の要素は「動いた」とは言わない
  for (const [el, d] of [...changedElements]) if (d === 0) changedElements.delete(el);
  const empty = balances.size === 0 || [...balances.values()].every((v) => v === 0);

  return (
    <div className="space-y-4 text-sm">
      {empty && <p className="text-muted-foreground">まだ何も記録されていません。記帳すると、ここに会社の姿が現れます。</p>}
      <section aria-label="貸借対照表">
        <h3 className="font-semibold mb-1">貸借対照表 <span className="text-xs font-normal text-muted-foreground">{company}</span></h3>
        <div className="grid grid-cols-2 gap-3 rounded-md border p-2">
          <div>
            <Group title="資産" lines={st.assets} diff={diff} />
            <Total label="資産合計" amount={st.totalAssets} />
          </div>
          <div>
            <Group title="負債" lines={st.liabilities} diff={diff} />
            <Total label="負債合計" amount={st.totalLiabilities} />
            <Group title="純資産" lines={st.equity} diff={diff} />
            {st.netIncome !== 0 && (
              <Row name="当期純利益" amount={st.netIncome} delta={changedElements.has("revenue") || changedElements.has("expense") ? (changedElements.get("revenue") ?? 0) - (changedElements.get("expense") ?? 0) : 0} />
            )}
            <Total label="負債・純資産合計" amount={st.totalLiabilities + st.totalEquity} />
          </div>
        </div>
        <p className={`mt-1 text-xs ${balanced ? "text-muted-foreground" : "text-rose-700"}`}>
          {balanced ? "左右の合計は一致しています。" : "左右の合計が一致していません。"}
        </p>
      </section>

      <section aria-label="損益計算書">
        <h3 className="font-semibold mb-1">損益計算書</h3>
        <div className="rounded-md border p-2">
          <Group title="収益" lines={st.revenues} diff={diff} />
          <Group title="費用" lines={st.expenses} diff={diff} />
          <Total label={st.netIncome >= 0 ? "当期純利益" : "当期純損失"} amount={Math.abs(st.netIncome)} />
        </div>
      </section>

      {changedElements.size > 0 && (
        <section aria-label="このステップの影響">
          <h3 className="font-semibold mb-1">このステップで動いた要素</h3>
          <ul className="flex flex-wrap gap-2">
            {ELEMENTS.filter((el) => changedElements.has(el)).map((el) => {
              const d = changedElements.get(el)!;
              return (
                <li key={el} className={`rounded-full px-2 py-0.5 text-xs ${d > 0 ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
                  {ELEMENT_LABELS[el]} {d > 0 ? "▲" : "▼"} {formatAmount(Math.abs(d))}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Group({ title, lines, diff }: { title: string; lines: StatementLine[]; diff: Map<string, number> }) {
  return (
    <div className="mb-2">
      <div className="text-xs font-semibold text-muted-foreground">{title}</div>
      {lines.length === 0 && <div className="text-xs text-muted-foreground/60">—</div>}
      {lines.map((l) => (
        <Row key={l.account} name={l.contra ? `${l.name}` : l.name} amount={l.amount} delta={diff.get(l.account) ?? 0} />
      ))}
    </div>
  );
}

function Row({ name, amount, delta }: { name: string; amount: number; delta: number }) {
  const changed = delta !== 0;
  return (
    <div className={`flex items-baseline justify-between gap-2 rounded px-1 ${changed ? "bg-amber-50" : ""}`}>
      <span className="truncate">{name}</span>
      <span className="tabular-nums whitespace-nowrap">
        {amount < 0 ? (
          <>
            <span aria-hidden>△</span>
            <span className="sr-only">マイナス </span>
            {formatAmount(-amount)}
          </>
        ) : (
          formatAmount(amount)
        )}
        {changed && (
          <span className={`ml-1 text-xs ${delta > 0 ? "text-emerald-700" : "text-rose-700"}`}>
            <span aria-hidden>{delta > 0 ? "▲" : "▼"}</span>
            <span className="sr-only">{delta > 0 ? "増加 " : "減少 "}</span>
            {formatAmount(Math.abs(delta))}
          </span>
        )}
      </span>
    </div>
  );
}

function Total({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between border-t mt-1 pt-1 font-medium">
      <span>{label}</span>
      <span className="tabular-nums">{formatAmount(amount)}</span>
    </div>
  );
}

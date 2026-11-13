"use client";

import { type Element, ELEMENTS, formatAmount } from "@/lib/accounting";
import type { GlossaryAccount } from "@/lib/content";
import { type Balances, type StatementLine, buildStatements } from "@/lib/ledger";
import { ELEMENT_STYLE } from "@/lib/elements";
import { AccountName } from "@/components/account-name";
import { ElementBadge } from "@/components/element-badge";
import { HelpIcon } from "./help-icon";

// 結果ペイン: 会社のかたち(資産vs負債 + 純資産の帯)、貸借対照表、損益計算書。前のステップからの差分を「+」「−」の符号で示す(▲△は日本の会計でマイナスの印なので使わない)

interface Props {
  accounts: ReadonlyMap<string, GlossaryAccount>;
  balances: Balances;
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
  // 純資産は当期純利益を含む定義で見せる(仕訳エディタの影響表示・predictの採点と同じ。docs/content-model.md)
  const netIncomeDelta = (changedElements.get("revenue") ?? 0) - (changedElements.get("expense") ?? 0);
  changedElements.set("equity", (changedElements.get("equity") ?? 0) + netIncomeDelta);
  for (const [el, d] of [...changedElements]) if (d === 0) changedElements.delete(el);
  const empty = balances.size === 0 || [...balances.values()].every((v) => v === 0);

  return (
    <div className="space-y-5 text-sm">
      {empty && <p className="text-muted-foreground">まだ何も記録されていません。記帳すると、ここに会社の姿が現れます。</p>}

      {!empty && <ShapeBars st={st} />}

      <section aria-label="貸借対照表">
        <h3 className="font-semibold mb-1">
          貸借対照表 <span className="text-xs font-normal text-muted-foreground">{company}</span>
        </h3>
        <div className="grid grid-cols-2 rounded-md border divide-x">
          <div className="flex flex-col p-2">
            <Group element="asset" lines={st.assets} diff={diff} accounts={accounts} />
            <Total label="資産合計" amount={st.totalAssets} />
          </div>
          <div className="flex flex-col p-2">
            <Group element="liability" lines={st.liabilities} diff={diff} accounts={accounts} />
            <Group element="equity" lines={st.equity} diff={diff} accounts={accounts}>
              {st.netIncome !== 0 && (
                <Row
                  name={<span>{st.netIncome >= 0 ? "当期純利益" : "当期純損失"}</span>}
                  amount={st.netIncome}
                  delta={netIncomeDelta}
                  magnitude
                />
              )}
            </Group>
            <Total label="負債・純資産合計" amount={st.totalLiabilities + st.totalEquity} />
          </div>
        </div>
        <p className={`mt-1 text-xs ${balanced ? "text-muted-foreground" : "text-error-fg"}`}>{balanced ? "左右の合計は一致しています。" : "左右の合計が一致していません。"}</p>
      </section>

      <section aria-label="損益計算書">
        <h3 className="font-semibold mb-1">損益計算書</h3>
        <div className="rounded-md border p-2">
          <Group element="revenue" lines={st.revenues} diff={diff} accounts={accounts} />
          <Group element="expense" lines={st.expenses} diff={diff} accounts={accounts} />
          <Total label={st.netIncome >= 0 ? "当期純利益" : "当期純損失"} amount={Math.abs(st.netIncome)} />
        </div>
      </section>

      {changedElements.size > 0 && (
        <section aria-label="このステップの影響">
          <h3 className="font-semibold mb-1">このステップで動いた要素</h3>
          <ul className="flex flex-wrap gap-1.5">
            {ELEMENTS.filter((el) => changedElements.has(el)).map((el) => {
              const d = changedElements.get(el)!;
              const s = ELEMENT_STYLE[el];
              return (
                <li key={el} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs motion-safe:animate-in motion-safe:fade-in ${s.bg} ${s.border} ${s.text}`}>
                  <span aria-hidden>{s.symbol}</span>
                  {s.label}
                  <span aria-hidden>{d > 0 ? "+" : "−"}</span>
                  <span className="sr-only">{d > 0 ? "増加" : "減少"}</span>
                  <span className="font-mono tabular-nums">{formatAmount(Math.abs(d))}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

/** 会社のかたち: 左に資産、右に負債と純資産を同じ幅で並べ、割合を帯で見せる。記帳のたびに幅がなめらかに変わる */
function ShapeBars({ st }: { st: ReturnType<typeof buildStatements> }) {
  const left = Math.max(st.totalAssets, 0);
  const right = Math.max(st.totalLiabilities, 0) + Math.max(st.totalEquity, 0);
  const scale = Math.max(left, right, 1);
  const pct = (n: number) => `${Math.max(0, (n / scale) * 100)}%`;
  const seg = (label: string, amount: number, cls: string) =>
    amount > 0 && (
      <div className={`h-full ${cls} motion-safe:transition-[width] motion-safe:duration-500 flex items-center overflow-hidden`} style={{ width: pct(amount) }} title={`${label} ${formatAmount(amount)}`}>
        <span className="px-1 text-[10px] text-white whitespace-nowrap">{label}</span>
      </div>
    );
  return (
    <section aria-label="会社のかたち" className="space-y-1" data-tour="shape">
      <div className="flex items-center gap-1">
        <h3 className="font-semibold">会社のかたち</h3>
        <HelpIcon topic="shape" />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="h-6 rounded-l bg-muted/60 flex overflow-hidden">{seg("資産", left, ELEMENT_STYLE.asset.bar)}</div>
        <div className="h-6 rounded-r bg-muted/60 flex overflow-hidden">
          {seg("負債", st.totalLiabilities, ELEMENT_STYLE.liability.bar)}
          {seg("純資産", st.totalEquity, ELEMENT_STYLE.equity.bar)}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">左の資産は、右の「返すお金(負債)」と「自分のもの(純資産)」でまかなわれています。</p>
    </section>
  );
}

function Group({ element, lines, diff, accounts, children }: { element: Element; lines: StatementLine[]; diff: Map<string, number>; accounts: ReadonlyMap<string, GlossaryAccount>; children?: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="mb-0.5">
        <ElementBadge element={element} size="xs" />
      </div>
      {lines.length === 0 && !children && <div className="text-xs text-muted-foreground/60 px-1">—</div>}
      {lines.map((l) => {
        const account = accounts.get(l.account);
        return <Row key={l.account} id={l.account} name={account ? <AccountName account={account} /> : l.name} amount={l.amount} delta={diff.get(l.account) ?? 0} magnitude={l.contra} />;
      })}
      {children}
    </div>
  );
}

function Row({ id, name, amount, delta, magnitude = false }: { id?: string; name: React.ReactNode; amount: number; delta: number; magnitude?: boolean }) {
  const changed = delta !== 0;
  // 当期純損失・評価勘定の △ は損失額・控除額の大きさなので、増減もその大きさの向きで示す。通常の科目のマイナス残高は符号どおり
  // 利益から損失に転じた記帳は増減額が損失額を超え、大きさの増減として読めないので符号どおり(0からの発生は大きさの増加)
  const shown = magnitude && amount < 0 && amount - delta <= 0 ? -delta : delta;
  return (
    <div data-account={id} className={`flex flex-wrap items-baseline justify-between gap-x-2 rounded px-1 ${changed ? "bg-changed motion-safe:animate-highlight" : ""}`}>
      <span className="min-w-0">{name}</span>
      <span className="ml-auto flex min-w-0 flex-wrap items-baseline justify-end gap-x-1 font-mono tabular-nums">
        <span className="min-w-0 wrap-anywhere">
          <SignedAmount amount={amount} />
        </span>
        {changed && (
          <span className="min-w-0 wrap-anywhere text-xs text-muted-foreground">
            <span aria-hidden>{shown > 0 ? "+" : "−"}</span>
            <span className="sr-only">{shown > 0 ? "増加" : "減少"}</span>
            {formatAmount(Math.abs(delta))}
          </span>
        )}
      </span>
    </div>
  );
}

function Total({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 border-t border-foreground/60 pt-1 font-medium">
      <span className="min-w-0">{label}</span>
      <span className="ml-auto min-w-0 wrap-anywhere font-mono tabular-nums">
        <SignedAmount amount={amount} />
      </span>
    </div>
  );
}

function SignedAmount({ amount }: { amount: number }) {
  if (amount >= 0) return formatAmount(amount);
  return (
    <>
      <span aria-hidden>△</span>
      <span className="sr-only">マイナス</span>
      {formatAmount(-amount)}
    </>
  );
}

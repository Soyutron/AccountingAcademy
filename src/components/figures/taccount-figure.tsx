import { type AccountInfo, accountIncreaseSide, formatAmount } from "@/lib/accounting";
import { ELEMENT_STYLE } from "@/lib/elements";

// T 勘定。左が借方、右が貸方。その科目が増える側に印を付ける

interface Line {
  label: string;
  amount: number;
}

export function TAccountFigure({ account, debit, credit }: { account: AccountInfo; debit: Line[]; credit: Line[] }) {
  const s = ELEMENT_STYLE[account.element];
  const inc = accountIncreaseSide(account);
  const sum = (lines: Line[]) => lines.reduce((t, l) => t + l.amount, 0);
  const balance = sum(debit) - sum(credit);
  const side = (title: string, lines: Line[], isIncrease: boolean) => (
    <div className="flex-1 min-w-0">
      <div className={`text-xs font-semibold px-1 ${isIncrease ? s.text : "text-muted-foreground"}`}>
        {title}
        {isIncrease && <span className="ml-1 font-normal">(増える側)</span>}
      </div>
      <ul className="text-xs font-mono tabular-nums">
        {lines.map((l, i) => (
          <li key={i} className="flex justify-between gap-2 px-1">
            <span className="truncate">{l.label}</span>
            <span>{formatAmount(l.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="text-sm">
      <div className={`inline-flex items-center gap-1 rounded-t-md border border-b-0 px-2 py-0.5 text-xs font-semibold ${s.bg} ${s.border} ${s.text}`}>
        <span aria-hidden>{s.symbol}</span>
        {account.name}
      </div>
      <div className="flex divide-x border-t-2 border-foreground/70">
        {side("借方", debit, inc === "debit")}
        {side("貸方", credit, inc === "credit")}
      </div>
      <div className="mt-1 text-right text-xs text-muted-foreground">
        残高 {formatAmount(Math.abs(balance))}({balance >= 0 ? "借方" : "貸方"})
      </div>
    </div>
  );
}

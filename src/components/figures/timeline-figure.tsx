import { formatAmount } from "@/lib/accounting";
import { ELEMENT_STYLE } from "@/lib/elements";

// 期間と配分。合計を n 期に等分し、各期の額を帯で見せる(費用配分の図)

export function TimelineFigure({ total, periods, unit, label }: { total: number; periods: number; unit: string; label?: string }) {
  const each = Math.floor(total / periods);
  const amount = formatAmount(each);
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-baseline justify-between">
        <span className="font-medium">{label ?? `合計 ${formatAmount(total)} 円を ${periods} ${unit}に分ける`}</span>
        <span className="text-xs text-muted-foreground">1 {unit}あたり {amount} 円</span>
      </div>
      {/* テーマごとに等幅フォントが違うので、列の最小幅は金額の文字数 + 余白ぶんを ch で取り、ペインが狭ければ折り返す */}
      <ol className="grid gap-1 font-mono text-xs" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${amount.length + 2}ch, 1fr))` }}>
        {Array.from({ length: periods }, (_, i) => (
          <li key={i} className={`rounded ${ELEMENT_STYLE.expense.bg} border ${ELEMENT_STYLE.expense.border} px-1 py-2 text-center`}>
            <div className="font-sans text-[10px] text-muted-foreground">
              {i + 1}
              {unit}目
            </div>
            <div className={`font-medium tabular-nums ${ELEMENT_STYLE.expense.text}`}>{amount}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

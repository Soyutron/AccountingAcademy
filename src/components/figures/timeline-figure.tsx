import { formatAmount } from "@/lib/accounting";
import { ELEMENT_STYLE } from "@/lib/elements";

// 期間と配分。合計を n 期に等分し、各期の額を帯で見せる(費用配分の図)

export function TimelineFigure({ total, periods, unit, label }: { total: number; periods: number; unit: string; label?: string }) {
  const each = Math.floor(total / periods);
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-baseline justify-between">
        <span className="font-medium">{label ?? `合計 ${formatAmount(total)} 円を ${periods} ${unit}に分ける`}</span>
        <span className="text-xs text-muted-foreground">1 {unit}あたり {formatAmount(each)} 円</span>
      </div>
      <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${periods}, minmax(0, 1fr))` }}>
        {Array.from({ length: periods }, (_, i) => (
          <li key={i} className={`rounded ${ELEMENT_STYLE.expense.bg} border ${ELEMENT_STYLE.expense.border} px-1 py-2 text-center`}>
            <div className="text-[10px] text-muted-foreground">
              {i + 1}
              {unit}目
            </div>
            <div className={`text-xs font-medium tabular-nums ${ELEMENT_STYLE.expense.text}`}>{formatAmount(each)}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

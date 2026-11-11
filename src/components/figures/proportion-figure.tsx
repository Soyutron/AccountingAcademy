import { type AccountInfo, formatAmount } from "@/lib/accounting";
import { ELEMENT_STYLE } from "@/lib/elements";

// 比例縮尺の貸借対照表。左に資産、右に負債と純資産を、金額に比例した高さで積む
// 金額の小さい項目(例: 資産の2%の当期純利益)でもラベルが読めるよう、各帯に最小の高さを確保し、
// 残りをflex-growで金額比に配る。その分だけ縮尺は厳密ではなくなるが、読めない帯より優先する

interface Item {
  account?: string;
  label?: string;
  amount: number;
}

export function ProportionFigure({ assets, liabilities, equity, accounts }: { assets: Item[]; liabilities: Item[]; equity: Item[]; accounts: ReadonlyMap<string, AccountInfo> }) {
  const total = assets.reduce((t, i) => t + i.amount, 0);
  const name = (i: Item) => i.label ?? accounts.get(i.account ?? "")?.name ?? i.account ?? "";
  const column = (items: Item[], bar: string, text: string) =>
    items.map((i, k) => (
      <div
        key={k}
        className={`${bar} flex min-h-5 basis-0 items-center justify-between gap-2 px-2 text-[11px] text-white`}
        style={{ flexGrow: Math.max(i.amount, 0) }}
        title={`${name(i)} ${formatAmount(i.amount)}`}
      >
        <span className="truncate">{name(i)}</span>
        <span className="font-mono tabular-nums shrink-0">{formatAmount(i.amount)}</span>
        <span className="sr-only">{text}</span>
      </div>
    ));
  return (
    <div className="text-sm">
      <div className="grid grid-cols-2 gap-1 h-40">
        <div className="flex flex-col rounded-l overflow-hidden gap-px">{column(assets, ELEMENT_STYLE.asset.bar, "資産")}</div>
        <div className="flex flex-col rounded-r overflow-hidden gap-px">
          {column(liabilities, ELEMENT_STYLE.liability.bar, "負債")}
          {column(equity, ELEMENT_STYLE.equity.bar, "純資産")}
        </div>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
        <span>資産{formatAmount(total)}</span>
        <span className="text-right">負債 + 純資産{formatAmount(liabilities.reduce((t, i) => t + i.amount, 0) + equity.reduce((t, i) => t + i.amount, 0))}</span>
      </div>
    </div>
  );
}

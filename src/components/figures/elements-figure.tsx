import type { AccountInfo, Element } from "@/lib/accounting";
import { ELEMENT_STYLE } from "@/lib/elements";

// 5つの箱。左に資産、右に負債と純資産(貸借対照表の形)、下に収益と費用(損益計算書)

interface Item {
  account: string;
  highlight: boolean;
}

export function ElementsFigure({ items, accounts }: { items: Item[]; accounts: ReadonlyMap<string, AccountInfo> }) {
  const byElement = (el: Element) => items.filter((i) => accounts.get(i.account)?.element === el);
  const box = (el: Element) => {
    const s = ELEMENT_STYLE[el];
    const list = byElement(el);
    return (
      <div className={`rounded-md border-2 p-2 min-h-16 ${s.border} ${s.bg}`}>
        <div className={`text-xs font-semibold ${s.text}`}>
          <span aria-hidden>{s.symbol} </span>
          {s.label}
        </div>
        <ul className="mt-1 flex flex-wrap gap-1">
          {list.map((i) => {
            const a = accounts.get(i.account)!;
            return (
              <li key={i.account} className={`rounded-full bg-background px-2 py-0.5 text-xs ${i.highlight ? `ring-2 ${s.ring} font-semibold` : ""}`}>
                {a.name}
                {a.contra && <span className="text-muted-foreground">(控除)</span>}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };
  return (
    <div className="space-y-2 text-sm">
      <div className="text-[10px] text-muted-foreground">貸借対照表</div>
      <div className="grid grid-cols-2 gap-2">
        {box("asset")}
        <div className="grid gap-2">
          {box("liability")}
          {box("equity")}
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground">損益計算書</div>
      <div className="grid grid-cols-2 gap-2">
        {box("expense")}
        {box("revenue")}
      </div>
    </div>
  );
}

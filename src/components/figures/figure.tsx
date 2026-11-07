import type { Unit } from "#content";
import { accountMap } from "@/lib/content";
import { ElementsFigure } from "./elements-figure";
import { FlowFigure } from "./flow-figure";
import { TimelineFigure } from "./timeline-figure";
import { TAccountFigure } from "./taccount-figure";
import { ProportionFigure } from "./proportion-figure";

// 図解ブロックの振り分け(docs/visual-guidelines.md 5 章)。種類ごとの描画は各ファイル

export type FigureSpec = Unit["steps"][number]["figures"][number];
type SimpleFigure = Exclude<FigureSpec, { type: "compare" }>;

// 実行時は YAML をそのまま解釈するので、スキーマの既定値(省略された配列など)をここで補う
function Simple({ spec }: { spec: SimpleFigure }) {
  switch (spec.type) {
    case "elements":
      return <ElementsFigure items={spec.items.map((i) => ({ account: i.account, highlight: i.highlight ?? false }))} accounts={accountMap} />;
    case "flow":
      return <FlowFigure nodes={spec.nodes} highlight={spec.highlight} />;
    case "timeline":
      return <TimelineFigure total={spec.total} periods={spec.periods} unit={spec.unit ?? "年"} label={spec.label} />;
    case "taccount":
      return <TAccountFigure account={accountMap.get(spec.account)!} debit={spec.debit ?? []} credit={spec.credit ?? []} />;
    case "proportion":
      return <ProportionFigure assets={spec.assets} liabilities={spec.liabilities ?? []} equity={spec.equity ?? []} accounts={accountMap} />;
  }
}

export function Figure({ spec }: { spec: FigureSpec }) {
  return (
    <figure className="not-prose my-4 rounded-lg border bg-card p-3" role="img" aria-label={spec.alt}>
      {spec.type === "compare" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[spec.left, spec.right].map((side) => (
            <div key={side.title}>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">{side.title}</div>
              <Simple spec={side.figure} />
            </div>
          ))}
        </div>
      ) : (
        <Simple spec={spec} />
      )}
      <figcaption className="mt-2 text-xs text-muted-foreground">{spec.alt}</figcaption>
    </figure>
  );
}

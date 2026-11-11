// 流れ図。左から右へ(入れ物が狭いときは上から下へ)。highlightのノードを強調する
// 3ペインではビューポートが広くてもガイドは狭いので、向きは入れ物の幅で決める

export function FlowFigure({ nodes, highlight }: { nodes: string[]; highlight?: number }) {
  return (
    <div className="@container">
      <ol className="flex flex-col @sm:flex-row @sm:flex-wrap @sm:items-center gap-1 text-sm">
        {nodes.map((n, i) => (
          <li key={i} className="flex flex-col @sm:flex-row @sm:items-center gap-1">
            <span className={`rounded-md border px-3 py-1.5 text-center @sm:whitespace-nowrap ${i === highlight ? "border-primary bg-primary/10 font-semibold" : "bg-background"}`}>{n}</span>
            {i < nodes.length - 1 && (
              <span className="text-muted-foreground text-center" aria-hidden>
                <span className="hidden @sm:inline">→</span>
                <span className="@sm:hidden">↓</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

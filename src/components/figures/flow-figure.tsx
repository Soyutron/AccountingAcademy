// 流れ図。左から右へ(狭い画面では上から下へ)。highlight のノードを強調する

export function FlowFigure({ nodes, highlight }: { nodes: string[]; highlight?: number }) {
  return (
    <ol className="flex flex-col sm:flex-row sm:items-center gap-1 text-sm">
      {nodes.map((n, i) => (
        <li key={i} className="flex flex-col sm:flex-row sm:items-center gap-1">
          <span className={`rounded-md border px-3 py-1.5 text-center ${i === highlight ? "border-primary bg-primary/10 font-semibold" : "bg-background"}`}>{n}</span>
          {i < nodes.length - 1 && (
            <span className="text-muted-foreground text-center" aria-hidden>
              <span className="hidden sm:inline">→</span>
              <span className="sm:hidden">↓</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

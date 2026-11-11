import type { Element } from "@/lib/accounting";
import { ELEMENT_STYLE } from "@/lib/elements";

// 要素のバッジ。色 + 記号 + 名前の3つで識別する(色だけに依存しない)

export function ElementBadge({ element, contra = false, size = "sm" }: { element: Element; contra?: boolean; size?: "xs" | "sm" }) {
  const s = ELEMENT_STYLE[element];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 ${size === "xs" ? "text-[10px] leading-4" : "text-xs leading-5"} ${s.text} ${s.bg} ${s.border}`}>
      <span aria-hidden>{s.symbol}</span>
      {s.label}
      {contra && <span className="opacity-80">(控除)</span>}
    </span>
  );
}

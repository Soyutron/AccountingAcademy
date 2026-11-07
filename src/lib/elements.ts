import type { Element } from "./accounting";

// 5 要素のビジュアル言語。アプリ全体で同じ色・記号・名前を使う(docs/ide-design.md 8 章)。
// Tailwind がクラス名を拾えるように、クラスは文字列のまま並べる

export interface ElementStyle {
  label: string;
  // 色に頼らない識別子(記号)
  symbol: string;
  text: string;
  bg: string;
  border: string;
  bar: string;
  ring: string;
}

export const ELEMENT_STYLE: Record<Element, ElementStyle> = {
  asset: { label: "資産", symbol: "◆", text: "text-sky-700", bg: "bg-sky-50", border: "border-sky-300", bar: "bg-sky-400", ring: "ring-sky-300" },
  liability: { label: "負債", symbol: "▲", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-300", bar: "bg-rose-400", ring: "ring-rose-300" },
  equity: { label: "純資産", symbol: "●", text: "text-violet-700", bg: "bg-violet-50", border: "border-violet-300", bar: "bg-violet-400", ring: "ring-violet-300" },
  revenue: { label: "収益", symbol: "＋", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", bar: "bg-emerald-400", ring: "ring-emerald-300" },
  expense: { label: "費用", symbol: "－", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", bar: "bg-amber-400", ring: "ring-amber-300" },
};

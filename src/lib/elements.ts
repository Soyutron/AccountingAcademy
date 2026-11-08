import type { Element } from "./accounting";

// 5 要素のビジュアル言語。アプリ全体で同じ色・記号・名前を使う(docs/ide-design.md 8 章)。
// 色の実体はテーマの CSS 変数(--el-<要素>-fg / -bg / -border / -bar。docs/design-system.md 2.2)。
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
  asset: { label: "資産", symbol: "◆", text: "text-asset-fg", bg: "bg-asset-bg", border: "border-asset-border", bar: "bg-asset-bar", ring: "ring-asset-border" },
  liability: { label: "負債", symbol: "▲", text: "text-liability-fg", bg: "bg-liability-bg", border: "border-liability-border", bar: "bg-liability-bar", ring: "ring-liability-border" },
  equity: { label: "純資産", symbol: "●", text: "text-equity-fg", bg: "bg-equity-bg", border: "border-equity-border", bar: "bg-equity-bar", ring: "ring-equity-border" },
  revenue: { label: "収益", symbol: "＋", text: "text-revenue-fg", bg: "bg-revenue-bg", border: "border-revenue-border", bar: "bg-revenue-bar", ring: "ring-revenue-border" },
  expense: { label: "費用", symbol: "－", text: "text-expense-fg", bg: "bg-expense-bg", border: "border-expense-border", bar: "bg-expense-bar", ring: "ring-expense-border" },
};

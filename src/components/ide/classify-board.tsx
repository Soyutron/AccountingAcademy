"use client";

import { useState } from "react";
import { type AccountInfo, type Element, ELEMENT_LABELS, ELEMENTS } from "@/lib/accounting";

// 仕分けボード: 科目を選んで 5 つの箱に入れる。クリックとキーボードだけで完結する

interface Props {
  accounts: AccountInfo[];
  placed: Partial<Record<string, Element>>;
  onChange: (placed: Partial<Record<string, Element>>) => void;
  wrong: Set<string>;
  disabled?: boolean;
}

export function ClassifyBoard({ accounts, placed, onChange, wrong, disabled }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const pool = accounts.filter((a) => !placed[a.id]);

  const place = (el: Element) => {
    if (!selected) return;
    onChange({ ...placed, [selected]: el });
    setSelected(null);
  };
  const unplace = (id: string) => {
    const next = { ...placed };
    delete next[id];
    onChange(next);
    setSelected(id);
  };

  const chip = (a: AccountInfo, inBin: boolean) => (
    <button
      key={a.id}
      type="button"
      disabled={disabled}
      onClick={() => (inBin ? unplace(a.id) : setSelected(selected === a.id ? null : a.id))}
      aria-pressed={inBin ? undefined : selected === a.id}
      className={`rounded-full border px-3 min-h-10 text-sm ${selected === a.id ? "border-primary bg-primary text-primary-foreground" : wrong.has(a.id) ? "border-rose-400 bg-rose-50" : "bg-background"}`}
    >
      {a.name}
      {wrong.has(a.id) && <span className="sr-only">(間違い)</span>}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-dashed p-2 min-h-10">
        <div className="text-xs text-muted-foreground mb-1">科目を選んでから、入れる箱を押します</div>
        <div className="flex flex-wrap gap-1">{pool.map((a) => chip(a, false))}</div>
        {pool.length === 0 && <div className="text-xs text-muted-foreground">全部の科目を箱に入れました。</div>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ELEMENTS.map((el) => (
          <div key={el} className="rounded-md border p-2 min-h-20">
            <button
              type="button"
              aria-disabled={disabled || !selected}
              onClick={() => !disabled && selected && place(el)}
              className={`w-full text-left text-xs font-semibold mb-1 rounded hover:bg-muted px-1 min-h-10 ${selected ? "" : "opacity-60"}`}
            >
              {ELEMENT_LABELS[el]}{selected ? " ← ここに入れる" : ""}
            </button>
            <div className="flex flex-wrap gap-1">{accounts.filter((a) => placed[a.id] === el).map((a) => chip(a, true))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

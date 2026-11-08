"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { GlossaryEntry } from "@/lib/content";
import { ElementBadge } from "./element-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// 本文中の用語。ホバーまたはタップで short → summary / example → 単元へ、と段階的に掘れる(要件 1 章)

export function Term({ entry, children }: { entry: GlossaryEntry; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ホバーで開いたときだけフォーカスを動かさない。キーボードで開いたときは中身にフォーカスを移して Tab で辿れるようにする
  const byHover = useRef(false);
  // 「もっと見る」は押すと消えるので、展開した説明にフォーカスを移して位置を失わないようにする
  const details = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const schedule = (next: boolean, delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      byHover.current = next;
      setOpen(next);
    }, delay);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (expanded) details.current?.focus();
  }, [expanded]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        byHover.current = false;
        setOpen(next);
        if (!next) setExpanded(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="term underline decoration-dotted decoration-primary/60 underline-offset-4 hover:decoration-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          onMouseEnter={() => schedule(true, 150)}
          onMouseLeave={() => schedule(false, 250)}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 text-sm space-y-2"
        onOpenAutoFocus={(e) => {
          if (byHover.current) e.preventDefault();
        }}
        aria-label={entry.name}
        onMouseEnter={() => timer.current && clearTimeout(timer.current)}
        onMouseLeave={() => schedule(false, 250)}
      >
        <div className="font-semibold flex items-center gap-2">
          {entry.name}
          {entry.element && <ElementBadge element={entry.element} contra={entry.contra} size="xs" />}
        </div>
        <p>{entry.short}</p>
        {expanded ? (
          <div ref={details} tabIndex={-1} className="space-y-2 border-t pt-2 focus:outline-none">
            <p>{entry.summary}</p>
            {entry.example && <p className="text-muted-foreground">例: {entry.example}</p>}
            {entry.related.length > 0 && (
              <p className="text-xs text-muted-foreground">
                関連: {entry.related.map((r) => r.name).join("、")}
              </p>
            )}
            <div className="flex gap-3 text-xs">
              <Link href={`/glossary#${entry.id}`} className="underline">
                用語集で見る
              </Link>
              {/* その単元自身を開いているときに自分へのリンクを出すと、押しても何も起きず壊れて見える */}
              {entry.unit &&
                (pathname === `/units/${entry.unit.id}` ? (
                  <span className="text-muted-foreground">この単元で学びます</span>
                ) : (
                  <Link href={`/units/${entry.unit.id}`} className="underline">
                    詳しく: {entry.unit.title}
                  </Link>
                ))}
            </div>
          </div>
        ) : (
          <button type="button" className="text-xs underline text-muted-foreground" onClick={() => setExpanded(true)}>
            もっと見る
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

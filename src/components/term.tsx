"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { GlossaryEntry } from "@/lib/content";
import { ElementBadge } from "./element-badge";
import { useCloseWhenHidden } from "./use-close-when-hidden";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// 本文中の用語。ホバーまたはタップで short → summary / example → 単元へ、と段階的に掘れる(要件 1 章)

export function Term({ entry, children }: { entry: GlossaryEntry; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ホバーで開いたときだけフォーカスを動かさない。キーボードで開いたときは中身にフォーカスを移して Tab で辿れるようにする
  const byHover = useRef(false);
  // 開いている間に中身へフォーカスが入ったかを覚えておく。onCloseAutoFocus は DOM を外した後に呼ばれるので、その時点では中身を調べられない
  const focusEntered = useRef(false);
  // 「もっと見る」は押すと消えるので、展開した説明にフォーカスを移して位置を失わないようにする
  const details = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // ホバーの開閉はマウスだけ。タップ後にブラウザが出す互換の mouseleave で閉じないよう、pointer イベントの種類で区別する
  const schedule = (e: React.PointerEvent, next: boolean, delay: number) => {
    if (e.pointerType !== "mouse") return;
    // クリックやキーボードで固定した用語は、Esc か外側のクリックで閉じるまでホバーでは動かさない
    if (open && !byHover.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      byHover.current = next;
      setOpen(next);
      if (!next) setExpanded(false);
    }, delay);
  };

  const changeOpen = (next: boolean) => {
    // 予約済みのホバーのタイマーが残ると、クリック直後の Esc で閉じた後に開き直る
    if (timer.current) clearTimeout(timer.current);
    byHover.current = false;
    setOpen(next);
    if (!next) setExpanded(false);
  };

  useCloseWhenHidden(trigger, open, () => changeOpen(false));

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    // カードがスクロールするときに、フォーカス移動で用語名が上へ隠れないようにする
    if (expanded) details.current?.focus({ preventScroll: true });
  }, [expanded]);

  return (
    <Popover
      open={open}
      onOpenChange={changeOpen}
    >
      <PopoverTrigger asChild>
        <button
          ref={trigger}
          type="button"
          className="term underline decoration-dotted decoration-primary/60 underline-offset-4 hover:decoration-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          onClick={(e) => {
            // ホバーで開いている用語を押したときは、トグルで閉じずに固定して中身へフォーカスを移す
            if (open && byHover.current) {
              e.preventDefault();
              if (timer.current) clearTimeout(timer.current);
              byHover.current = false;
              content.current?.querySelector<HTMLElement>("button, a")?.focus();
            }
          }}
          onPointerEnter={(e) => schedule(e, true, 150)}
          onPointerLeave={(e) => schedule(e, false, 250)}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        ref={content}
        // 横向きのスマホでは上下どちらにも展開後の高さが無い。上限が無いと先頭が画面の外に切れて読めない(Issue #225)
        className="w-80 max-h-(--radix-popover-content-available-height) overflow-y-auto overscroll-contain text-sm space-y-2"
        onOpenAutoFocus={(e) => {
          if (byHover.current) e.preventDefault();
        }}
        onFocus={() => {
          focusEntered.current = true;
        }}
        onCloseAutoFocus={(e) => {
          // フォーカスが中に入らなかった(ホバーで見ただけの)ときは、入力欄で打っている途中の打鍵を奪わないよう動かさない
          if (!focusEntered.current) e.preventDefault();
          focusEntered.current = false;
        }}
        onInteractOutside={(e) => {
          // Radix は用語の押下も「外側の操作」と覚え、ホバー後にクリックで固定した用語を Esc で閉じたときに用語へフォーカスを戻さない
          if (trigger.current?.contains(e.target as Node)) e.preventDefault();
        }}
        aria-label={entry.name}
        onPointerEnter={(e) => e.pointerType === "mouse" && timer.current && clearTimeout(timer.current)}
        onPointerLeave={(e) => schedule(e, false, 250)}
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
                関連:{" "}
                {entry.related.map((r, i) => (
                  <span key={r.id}>
                    {i > 0 && "、"}
                    <Link href={`/glossary#${r.id}`} className="underline">
                      {r.name}
                    </Link>
                  </span>
                ))}
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

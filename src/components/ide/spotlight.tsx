"use client";

import { useEffect, useRef, useState } from "react";

// 対象を明るく残して周りを暗くする。ツアーと「使い方」の「場所を示す」で共用(docs/help-design.md 5.3)

/** 対象要素の位置を追いかける。レイアウトの変化に追従するため短い間隔で測り直す。revealなら、最初に見えた時に隠れていれば画面内へ出す */
export function useTargetRect(target?: string, { reveal = false }: { reveal?: boolean } = {}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!target) {
      const id = requestAnimationFrame(() => setRect(null));
      return () => cancelAnimationFrame(id);
    }
    let pendingReveal = reveal;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
      // 閉じる途中のDialogの暗幕が残っている間は、対象が見えていても隠れと判定されるので待つ
      if (el && pendingReveal && el.getBoundingClientRect().width > 0 && !document.querySelector('[data-slot="dialog-overlay"]')) {
        pendingReveal = false;
        revealIfCovered(el);
      }
      setRect(el ? el.getBoundingClientRect() : null);
    };
    const raf = requestAnimationFrame(measure);
    const timer = setInterval(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
      window.removeEventListener("resize", measure);
    };
  }, [target, reveal]);
  return rect;
}

// 固定バーの裏や画面外にある対象だけを動かす。固定バー自身の中の対象まで中央へ寄せると、ページだけが無駄に動く。
// 画面より高いペインは中央へ寄せると先頭が切れるので動かさない
function revealIfCovered(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.height >= window.innerHeight) return;
  // 前の段の位置に残っているカードは、これから動くので隠れとして数えない
  const hitAt = (y: number) => document.elementsFromPoint(r.left + r.width / 2, y).find((e) => !e.closest("[data-tour-card]"));
  const center = hitAt(r.top + r.height / 2);
  if (!center || !el.contains(center)) return el.scrollIntoView({ block: "center" });
  // 中心が見えていても下半分が下の固定バーに隠れることがある(#269)。バーの上端まで持ち上げるが、
  // 上端が画面外か上の固定バーに入るなら(結果ペインのように上下のバーの間に収まらない対象)動かさない
  const barAt = (y: number) => {
    let e = hitAt(y) ?? null;
    if (e && el.contains(e)) return null;
    while (e && !["fixed", "sticky"].includes(getComputedStyle(e).position)) e = e.parentElement;
    return e?.getBoundingClientRect() ?? null;
  };
  const delta = r.bottom - (barAt(Math.min(r.bottom, window.innerHeight) - 1)?.top ?? window.innerHeight) + 8;
  if (delta <= 8) return;
  const top = r.top - delta;
  if (top >= 0 && !barAt(top)) window.scrollBy({ top: delta });
}

export function SpotlightRing({ rect }: { rect: DOMRect }) {
  return (
    <div
      className="absolute rounded-md ring-2 ring-primary motion-safe:transition-all motion-safe:duration-300"
      style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)" }}
    />
  );
}

/** 「場所を示す」: 対象を数秒光らせる。何か操作するかEscで消える */
export function Spotlight({ target, onDone }: { target: string; onDone: () => void }) {
  const rect = useTargetRect(target, { reveal: true });
  // onDoneは描画ごとに作り直されるが、位置の計測で再描画するたびに3秒を数え直さないようrefで参照する
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const finish = () => done.current();
    const timer = setTimeout(finish, 3000);
    window.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", finish);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
    };
  }, [target]);
  if (!rect || rect.width === 0) return null;
  return (
    <div className="fixed inset-0 z-50 pointer-events-none" aria-hidden data-spotlight={target}>
      <SpotlightRing rect={rect} />
    </div>
  );
}

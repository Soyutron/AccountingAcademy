"use client";

import { useEffect, useRef, useState } from "react";

// 対象を明るく残して周りを暗くする。ツアーと「使い方」の「場所を示す」で共用(docs/help-design.md 5.3)

/** 対象要素の位置を追いかける。レイアウトの変化に追従するため短い間隔で測り直す */
export function useTargetRect(target?: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!target) {
      const id = requestAnimationFrame(() => setRect(null));
      return () => cancelAnimationFrame(id);
    }
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
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
  }, [target]);
  return rect;
}

export function SpotlightRing({ rect }: { rect: DOMRect }) {
  return (
    <div
      className="absolute rounded-md ring-2 ring-primary motion-safe:transition-all motion-safe:duration-300"
      style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)" }}
    />
  );
}

/** 「場所を示す」: 対象を数秒光らせる。何か操作するか Esc で消える */
export function Spotlight({ target, onDone }: { target: string; onDone: () => void }) {
  const rect = useTargetRect(target);
  // onDone は描画ごとに作り直されるが、位置の計測で再描画するたびに 3 秒を数え直さないよう ref で参照する
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

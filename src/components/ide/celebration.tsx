"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// 正解した瞬間の短い紙吹雪(docs/visual-guidelines.md 2 章「達成・区切り」)。
// FlyingAmounts と同じく、イベントを state に積んで onDone で消す。装飾なので aria-hidden、クリックは通す

export interface Burst {
  id: string;
  // 出発点(ビューポート座標)
  from: { x: number; y: number };
  // 単元の最後のステップは少し多めにする
  big: boolean;
}

interface Piece {
  x: number;
  y: number;
  rotate: number;
  color: string;
  delay: number;
}

// 5 要素の配色から(docs/ide-design.md 8 章)。色だけに意味は持たせない
const COLORS = ["bg-emerald-400", "bg-sky-400", "bg-violet-400", "bg-amber-400", "bg-rose-400"];

function makePieces(big: boolean): Piece[] {
  const count = big ? 48 : 24;
  return Array.from({ length: count }, (_, i) => {
    // 真上を中心に左右 70 度ほどへ散らす
    const angle = (-90 + (Math.random() - 0.5) * 140) * (Math.PI / 180);
    const distance = (big ? 160 : 110) + Math.random() * (big ? 160 : 100);
    return {
      x: Math.cos(angle) * distance,
      // 落下ぶんを足して放物線に近づける
      y: Math.sin(angle) * distance + 60,
      rotate: (Math.random() - 0.5) * 540,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.08,
    };
  });
}

function BurstView({ burst, onDone }: { burst: Burst; onDone: () => void }) {
  const [pieces] = useState(() => makePieces(burst.big));
  const duration = burst.big ? 1.4 : 1.1;
  return (
    <div data-celebration className="absolute" style={{ left: burst.from.x, top: burst.from.y }}>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute block h-2 w-1.5 rounded-[1px] ${p.color}`}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: [1, 1, 0], rotate: p.rotate, scale: [1, 1, 0.6] }}
          transition={{ duration, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={i === 0 ? onDone : undefined}
        />
      ))}
    </div>
  );
}

export function Celebration({ bursts, onDone }: { bursts: Burst[]; onDone: (id: string) => void }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {bursts.map((b) => (
          <BurstView key={b.id} burst={b} onDone={() => onDone(b.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

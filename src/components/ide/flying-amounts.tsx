"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatAmount } from "@/lib/accounting";
import { ELEMENT_STYLE } from "@/lib/elements";
import type { Element } from "@/lib/accounting";

// 取引の流れのアニメーション: 記帳した仕訳の金額が、財務諸表の該当行へ飛ぶ(docs/visual-guidelines.md 2 章)

export interface Flight {
  id: string;
  element: Element;
  amount: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export function FlyingAmounts({ flights, onDone }: { flights: Flight[]; onDone: (id: string) => void }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-hidden>
      <AnimatePresence>
        {flights.map((f) => {
          const s = ELEMENT_STYLE[f.element];
          return (
            <motion.div
              key={f.id}
              className={`absolute rounded-full border px-2 py-0.5 text-xs font-medium shadow-sm ${s.bg} ${s.border} ${s.text}`}
              initial={{ x: f.from.x, y: f.from.y, opacity: 1, scale: 1 }}
              animate={{ x: f.to.x, y: f.to.y, opacity: [1, 1, 0], scale: [1, 1.05, 0.9] }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => onDone(f.id)}
            >
              {formatAmount(f.amount)}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

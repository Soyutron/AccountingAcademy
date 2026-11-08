"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

// 正解した瞬間の祝福(docs/visual-guidelines.md 2 章「達成・区切り」)。
// 画面の両下からクラッカーが上がり、上から紙吹雪が降り、中央に「できました」の札を短く出す。
// FlyingAmounts と同じく、イベントを state に積んで onDone で消す。装飾なので aria-hidden、クリックは通す

export interface Burst {
  id: string;
  // 単元の最後のステップは量と時間を増やし、札の文言も変える
  big: boolean;
}

interface Piece {
  // 出発点(ビューポート座標)
  startX: number;
  startY: number;
  // 到達点までの移動量
  dx: number;
  dy: number;
  rotate: number;
  color: string;
  // 形の違いで散らばりに表情を付ける
  shape: "rect" | "dot" | "strip";
  delay: number;
  duration: number;
}

// 5 要素の帯の色とブランドの差し色(テーマが決める)。色だけに意味は持たせない
const COLORS = ["bg-revenue-bar", "bg-asset-bar", "bg-equity-bar", "bg-expense-bar", "bg-liability-bar", "bg-brand-accent"];
const SHAPES: Piece["shape"][] = ["rect", "dot", "strip", "rect"];
const SHAPE_CLASS: Record<Piece["shape"], string> = {
  rect: "h-2.5 w-2 rounded-[1px]",
  dot: "size-2 rounded-full",
  strip: "h-4 w-1.5 rounded-[1px]",
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// 画面の左右下の角から、中央上方へ向けて撃ち上げるクラッカー
function cracker(side: "left" | "right", count: number, vw: number, vh: number, offset: number): Piece[] {
  const reach = Math.max(vw, vh);
  return Array.from({ length: count }, (_, i) => {
    // 左は右上へ、右は左上へ。鉛直から 15〜75 度の扇形
    const deg = side === "left" ? rand(-75, -15) : rand(-165, -105);
    const angle = deg * (Math.PI / 180);
    const distance = rand(0.45, 0.95) * reach;
    return {
      startX: side === "left" ? -8 : vw + 8,
      startY: vh + 8,
      dx: Math.cos(angle) * distance,
      // 落下ぶんを足して放物線に近づける
      dy: Math.sin(angle) * distance + rand(0.15, 0.35) * vh,
      rotate: rand(-720, 720),
      color: COLORS[(i + offset) % COLORS.length],
      shape: SHAPES[(i + offset) % SHAPES.length],
      delay: rand(0, 0.12),
      duration: rand(1.4, 2.0),
    };
  });
}

// 画面の上端全体から降る紙吹雪
function rain(count: number, vw: number, vh: number, offset: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    startX: rand(0, vw),
    startY: -24,
    dx: rand(-0.08, 0.08) * vw,
    dy: vh + 48,
    rotate: rand(-900, 900),
    color: COLORS[(i + offset) % COLORS.length],
    shape: SHAPES[(i * 3 + offset) % SHAPES.length],
    delay: rand(0.1, 0.7),
    duration: rand(1.8, 2.6),
  }));
}

function makePieces(big: boolean): Piece[] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // 狭い画面では枚数を落として描画負荷を抑える
  const scale = Math.min(1, vw / 1024) * (big ? 1.4 : 1);
  const perCracker = Math.round(36 * scale);
  const rainCount = Math.round(60 * scale);
  return [...cracker("left", perCracker, vw, vh, 0), ...cracker("right", perCracker, vw, vh, 3), ...rain(rainCount, vw, vh, 1)];
}

function BurstView({ burst, onDone }: { burst: Burst; onDone: () => void }) {
  const [pieces] = useState(() => makePieces(burst.big));
  // 紙吹雪が降り切る時間。最後に全体を薄くして、遅れた破片も一緒に消す
  const total = burst.big ? 3.0 : 2.6;
  return (
    <motion.div
      data-celebration
      className="absolute inset-0"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration: total, times: [0, 0.85, 1], ease: "linear" }}
      onAnimationComplete={onDone}
    >
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute block ${SHAPE_CLASS[p.shape]} ${p.color}`}
          style={{ left: p.startX, top: p.startY }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.dx, y: p.dy, opacity: [1, 1, 0.9, 0], rotate: p.rotate }}
          // 値ごとの指定は duration と delay を引き継がないので、opacity にも同じ時間を渡す
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.2, 0.8, 0.4, 1],
            opacity: { duration: p.duration, delay: p.delay, times: [0, 0.6, 0.85, 1], ease: "linear" },
          }}
        />
      ))}
      {/* 中央の札。正解したことと次へ進めることを、紙吹雪とは別に文字でも伝える */}
      <motion.div
        className="absolute inset-x-4 top-1/2 flex justify-center"
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: [0, 1, 1, 0], y: [16, 0, 0, -8], scale: [0.9, 1.04, 1, 1] }}
        transition={{ duration: burst.big ? 2.4 : 2.0, times: [0, 0.15, 0.8, 1], ease: "easeOut" }}
      >
        <div className="flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl bg-ok px-8 py-5 text-center text-ok-fg shadow-lg ring-1 ring-foreground/10">
          <CheckCircle2 className="size-12" strokeWidth={2.25} />
          <p className="font-heading text-3xl font-bold">できました!</p>
          <p className="text-sm font-medium opacity-90">{burst.big ? "この単元を最後までやりきりました" : "「次へ →」で次のステップへ進めます"}</p>
        </div>
      </motion.div>
    </motion.div>
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

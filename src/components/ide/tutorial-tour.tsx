"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { JournalLine } from "@/lib/accounting";
import { updateTutorial } from "@/lib/tutorial-store";

// 操作しながら使い方を覚えるツアー。対象を明るく残して周りを暗くし、ユーザーの操作が済むまで待つ(docs/ide-design.md)

export type TourPane = "guide" | "work" | "result";

export interface TourContext {
  stepIndex: number;
  postedCount: number;
  debit: JournalLine[];
  credit: JournalLine[];
}

interface TourStep {
  target?: string;
  // スマートフォンでは 1 ペインずつ表示するので、対象のあるペインへ切り替える
  pane?: TourPane;
  title: string;
  body: string;
  // 操作が済んだら true。無ければ「次へ」で進む
  done?: (ctx: TourContext) => boolean;
  waiting?: string;
}

// 6 段目の文言が画面の数値と一致するよう、科目だけでなく金額まで確かめる
const hasLine = (lines: JournalLine[], account: string, amount: number) => lines.some((l) => l.account === account && l.amount === amount);

const STEPS: TourStep[] = [
  { title: "会計 IDE へようこそ", body: "2 分で使い方を体験します。実際に 1 件記帳してみましょう。いつでもスキップできます。" },
  { target: "guide", pane: "guide", title: "ここはガイド", body: "物語と「やること」を読む場所です。ステップごとに 2〜4 文だけなので、読んだらすぐ手を動かします。" },
  { target: "next-button", title: "次へ進む", body: "「次へ →」を押して、最初の課題に進みましょう。", done: (c) => c.stepIndex >= 1, waiting: "「次へ →」を押してください" },
  { target: "journal-debit", pane: "work", title: "借方(左)に書く", body: "科目に「現金」、金額に 100000 と入れます。科目は途中まで打つと候補が出ます。", done: (c) => hasLine(c.debit, "cash", 100000), waiting: "借方に 現金 100,000 を入れてください" },
  { target: "journal-credit", pane: "work", title: "貸方(右)に書く", body: "科目に「資本金」、金額に 100000 と入れます。", done: (c) => hasLine(c.credit, "capital_stock", 100000), waiting: "貸方に 資本金 100,000 を入れてください" },
  { target: "impact", pane: "work", title: "影響がその場で見える", body: "資産 +100,000、純資産 +100,000。借方と貸方の合計も一致しました。記帳する前に、何が動くかが分かります。" },
  { target: "post-button", pane: "work", title: "記帳する", body: "「記帳する」を押します(金額欄で Enter でも記帳できます)。", done: (c) => c.postedCount >= 1, waiting: "「記帳する」を押してください" },
  { target: "statements", pane: "result", title: "ここは結果", body: "貸借対照表に現金と資本金が現れ、▲ が付きました。記帳のたびにここが動きます。科目名に触れると意味が出ます。" },
  { target: "shape", pane: "result", title: "会社のかたち", body: "上の帯は、左の資産が右の負債と純資産でまかなわれている様子です。帯の幅が記帳で変わっていきます。" },
  { target: "hint", pane: "guide", title: "迷ったら", body: "「ヒントを見る」で手がかりが出ます。2 回間違えると「答えを見る」も使えます。" },
  { target: "help-button", title: "困ったら「使い方」", body: "右上の「使い方」から、各機能の説明と、このチュートリアルのやり直しができます。" },
  { title: "できました", body: "使い方は以上です。ここからは 3 級パスの最初の単元で、カフェを開業するところから始めましょう。" },
];

export function TutorialTour({ ctx, onExit, onPane }: { ctx: TourContext; onExit: () => void; onPane: (pane: TourPane) => void }) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const rect = useTargetRect(step.target);
  const last = index === STEPS.length - 1;
  const satisfied = step.done ? step.done(ctx) : true;
  const card = useRef<HTMLDivElement>(null);

  // 開いた時と段が変わった時にカードへフォーカスを移す。吹き出しは DOM の末尾にあり、
  // 操作待ちの段では主ボタンが無効になってフォーカスが body に落ちるため(Issue #51)
  useEffect(() => {
    card.current?.focus();
  }, [index]);

  const finish = () => {
    updateTutorial({ status: "done" });
    onExit();
  };
  const skip = () => {
    // 最後のカードまで来ていれば完了扱い。途中なら「スキップ」として記録し、あとで「使い方」からやり直せる
    updateTutorial({ status: last ? "done" : "skipped" });
    onExit();
  };
  const next = () => {
    if (last) return finish();
    const pane = STEPS[index + 1].pane;
    if (pane) onPane(pane);
    setIndex(index + 1);
  };

  // 対象が画面に無い(スマートフォンで別タブ)ときはカードだけ出す
  const spotlight = rect && rect.width > 0 ? rect : null;
  const cardStyle = spotlight ? placeCard(spotlight) : { left: "50%", bottom: "6rem", transform: "translateX(-50%)" };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" role="dialog" aria-modal="false" aria-label="チュートリアル">
      {spotlight ? (
        <div
          className="absolute rounded-md ring-2 ring-primary motion-safe:transition-all motion-safe:duration-300"
          style={{ left: spotlight.left - 6, top: spotlight.top - 6, width: spotlight.width + 12, height: spotlight.height + 12, boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)" }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/30" />
      )}
      <div ref={card} tabIndex={-1} role="group" aria-labelledby="tutorial-tour-title" aria-describedby="tutorial-tour-body" className="pointer-events-auto absolute w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-background p-4 shadow-lg text-sm space-y-2 focus:outline-none" style={cardStyle}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            チュートリアル {index + 1} / {STEPS.length}
          </span>
          <button type="button" className="underline" onClick={skip}>
            {last ? "閉じる" : "スキップ"}
          </button>
        </div>
        <p id="tutorial-tour-title" className="font-semibold">{step.title}</p>
        <p id="tutorial-tour-body">{step.body}</p>
        {!satisfied && step.waiting && <p className="text-xs text-primary">{step.waiting}</p>}
        <div className="flex justify-end gap-2 pt-1">
          {last ? (
            <>
              <Button size="sm" variant="outline" onClick={finish}>
                閉じる
              </Button>
              <Button size="sm" asChild onClick={finish}>
                <Link href="/units/bookkeeping-basics/five-elements">3 級パスの最初の単元へ</Link>
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={next} disabled={!satisfied}>
              {index === 0 ? "はじめる" : "次へ"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 対象要素の位置を追いかける。レイアウトの変化に追従するため短い間隔で測り直す */
function useTargetRect(target?: string) {
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

function placeCard(r: DOMRect): React.CSSProperties {
  const margin = 12;
  const cardHeight = 200;
  const below = r.bottom + margin + cardHeight < window.innerHeight;
  const top = below ? r.bottom + margin : Math.max(margin, r.top - margin - cardHeight);
  const left = Math.min(Math.max(margin, r.left), window.innerWidth - 320 - margin);
  return { left, top };
}

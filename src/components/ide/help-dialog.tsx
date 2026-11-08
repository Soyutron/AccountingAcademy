"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type HelpContext, type HelpTopic, HELP_CATEGORIES, HELP_TOPICS, currentTopics, helpTopic } from "@/lib/help-topics";
import { TUTORIAL_UNIT_ID, updateTutorial, useTutorialState } from "@/lib/tutorial-store";

// 「使い方」: いまの画面に出ている機能を先に、残りは分類ごとに畳んで出す。末尾にチュートリアルの設定(docs/help-design.md 5.3)

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // 「?」から開いたときに見せる話題。その分類を開いて話題へフォーカスを移す
  focusTopic: string | null;
  ctx: HelpContext;
  stepLabel: string;
  onRestartTour?: () => void;
}

export function HelpDialog({ open, onOpenChange, focusTopic, ctx, stepLabel, onRestartTour }: Props) {
  const state = useTutorialState();
  const current = currentTopics(ctx);
  const focusCategory = focusTopic ? helpTopic(focusTopic).category : null;
  const content = useRef<HTMLDivElement>(null);
  // 「チュートリアルを最初から」で閉じるときは、フォーカスをトリガーに戻さずツアーの吹き出しに任せる(Issue #51)
  const toTour = useRef(false);

  // 開いたあとに話題へ移す。Dialog の初期フォーカスより後に動かす必要があるので、次のフレームで行う
  useEffect(() => {
    if (!open || !focusTopic) return;
    const id = requestAnimationFrame(() => {
      const el = content.current?.querySelector<HTMLElement>(`#help-${focusTopic}`);
      el?.scrollIntoView({ block: "center" });
      el?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, focusTopic]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-tour="help-button">
          使い方
        </Button>
      </DialogTrigger>
      <DialogContent
        ref={content}
        className="max-h-[85dvh] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={(e) => {
          if (toTour.current) e.preventDefault();
          toTour.current = false;
        }}
      >
        <DialogHeader>
          <DialogTitle>会計 IDE の使い方</DialogTitle>
          <DialogDescription>困ったときに、必要なところだけ開いて読めます。</DialogDescription>
        </DialogHeader>

        {current.length > 0 && (
          <section aria-labelledby="help-current" className="space-y-2">
            <h3 id="help-current" className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm font-semibold">
              いまの画面でできること
              <span className="text-xs font-normal text-muted-foreground">{stepLabel}</span>
            </h3>
            <TopicList topics={current} idPrefix="now" />
          </section>
        )}

        <section aria-labelledby="help-all" className="space-y-1">
          <h3 id="help-all" className="text-sm font-semibold">
            すべての機能
          </h3>
          {HELP_CATEGORIES.map((cat) => {
            const topics = HELP_TOPICS.filter((t) => t.category === cat.id);
            return (
              // key に focusCategory を含め、「?」から開き直したときに open 属性を初期値から効かせる
              <details key={`${cat.id}-${focusCategory === cat.id}`} open={focusCategory === cat.id} className="group rounded-md border">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-sm marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="font-medium">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {topics.length} 項目 <span aria-hidden className="inline-block transition-transform group-open:rotate-90">▸</span>
                  </span>
                </summary>
                <div className="border-t px-3 py-2">
                  <TopicList topics={topics} idPrefix="help" />
                </div>
              </details>
            );
          })}
        </section>

        <section aria-labelledby="help-tutorial" className="space-y-2 border-t pt-3">
          <h3 id="help-tutorial" className="text-sm font-semibold">
            チュートリアルと設定
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {onRestartTour ? (
              // 同じページでツアーを始めるので、ダイアログを閉じないとツアーがモーダルの背後に隠れる
              <DialogClose asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    toTour.current = true;
                    onRestartTour();
                  }}
                >
                  チュートリアルを最初から
                </Button>
              </DialogClose>
            ) : (
              <Button size="sm" asChild>
                <Link href={`/units/${TUTORIAL_UNIT_ID}?tour=1`}>チュートリアルを最初から</Link>
              </Button>
            )}
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={state.enabled} onChange={(e) => updateTutorial({ enabled: e.target.checked })} />
              初めて単元を開いたときにチュートリアルを案内する
            </label>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}

function TopicList({ topics, idPrefix }: { topics: HelpTopic[]; idPrefix: string }) {
  return (
    <dl className="space-y-2 text-sm">
      {topics.map((t) => (
        <div key={t.id} id={`${idPrefix}-${t.id}`} tabIndex={-1} className="-mx-1 rounded-sm px-1 focus:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <dt className="font-semibold">{t.title}</dt>
          <dd className="text-muted-foreground">{t.body}</dd>
        </div>
      ))}
    </dl>
  );
}

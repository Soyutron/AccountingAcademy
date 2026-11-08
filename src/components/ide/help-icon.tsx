"use client";

import { CircleHelp } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { helpTopic } from "@/lib/help-topics";

// 機能の見出し横の「?」。押すとその機能だけの短い説明を出す(docs/help-design.md 5.1)

export interface HelpControls {
  // 「使い方」をその話題を開いた状態で表示する
  openTopic: (id: string) => void;
  // ツアー中はスポットライトと説明が重なるので出さない
  hidden: boolean;
}

// IDE の外(説明文中の仕訳エディタなど)では「使い方」が無いので、リンク無しで説明だけ出す
export const HelpControlsContext = createContext<HelpControls | null>(null);

export function HelpIcon({ topic: id }: { topic: string }) {
  const controls = useContext(HelpControlsContext);
  const [open, setOpen] = useState(false);
  const topic = helpTopic(id);
  if (controls?.hidden) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* 見出しの行高を変えないよう、押せる範囲は負のマージンで確保する */}
        <button
          type="button"
          aria-label={`「${topic.title}」の説明`}
          className="-my-2 inline-flex size-7 shrink-0 items-center justify-center rounded-md align-middle text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CircleHelp className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-2 text-sm" aria-label={topic.title}>
        <p className="font-semibold">{topic.title}</p>
        <p>{topic.short}</p>
        {controls && (
          <button
            type="button"
            className="self-start text-xs underline text-muted-foreground"
            onClick={() => {
              setOpen(false);
              controls.openTopic(id);
            }}
          >
            もっと詳しく →
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

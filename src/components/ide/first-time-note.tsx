"use client";

import { Button } from "@/components/ui/button";
import type { HelpTopic } from "@/lib/help-topics";

// 初めて出る課題の種類の案内。モーダルにせず、フォーカスも奪わない(docs/help-design.md 5.2)

export function FirstTimeNote({ topic, onMore, onDismiss }: { topic: HelpTopic; onMore: () => void; onDismiss: () => void }) {
  return (
    <div role="note" aria-label={`初めての「${topic.title}」`} className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm space-y-2">
      <p className="font-semibold">初めての「{topic.title}」</p>
      <p>{topic.short}</p>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onMore}>
          くわしく
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss}>
          わかった
        </Button>
      </div>
    </div>
  );
}

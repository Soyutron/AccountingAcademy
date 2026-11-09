import type { Metadata } from "next";
import { Suspense } from "react";
import { glossary, sortedDomains, conceptList } from "@/lib/content";
import { GlossarySearch, GlossarySearchFromUrl } from "./glossary-search";

export const metadata: Metadata = { title: "用語集" };

export default function GlossaryPage() {
  const domainTitles = Object.fromEntries(sortedDomains.map((d) => [d.id, d.title]));
  const domainOf = Object.fromEntries(conceptList.map((c) => [c.id, c.domain]));
  const searchProps = { entries: glossary, domainTitles, domainOf };
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">用語集</h1>
        <p className="text-muted-foreground">概念と勘定科目。暗記するためではなく、「なぜ必要か」「何とつながるか」を確かめるために使ってください。</p>
      </div>
      {/* 全件の一覧を初期 HTML に残す。#用語 へのアンカーが読み込み直後に効くように */}
      <Suspense fallback={<GlossarySearch {...searchProps} />}>
        <GlossarySearchFromUrl {...searchProps} />
      </Suspense>
    </div>
  );
}

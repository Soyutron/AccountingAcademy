"use client";

import Link from "next/link";
import { useState } from "react";
import { flushSync } from "react-dom";
import type { GlossaryEntry } from "@/lib/content";
import { ElementBadge } from "@/components/element-badge";
import { Input } from "@/components/ui/input";

// 用語集の検索。名前・別名・short の部分一致。規模が小さいので配列のフィルタで足りる

export function GlossarySearch({
  entries,
  domainTitles,
  domainOf,
}: {
  entries: GlossaryEntry[];
  domainTitles: Record<string, string>;
  domainOf: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const hits = q ? entries.filter((e) => e.name.includes(q) || e.aliases.some((a) => a.includes(q)) || e.short.includes(q)) : entries;
  // 説明文にだけ語を含む項目が分野の順で先に並ぶと、探している項目が埋もれる(Issue #86)
  const exact = q ? hits.filter((e) => e.name === q || e.aliases.includes(q)) : [];
  const others = hits.filter((e) => !exact.includes(e));
  const concepts = others.filter((e) => e.kind === "concept");
  const accounts = others.filter((e) => e.kind === "account");

  const groups: { title: string; items: GlossaryEntry[] }[] = [
    { title: "一致する用語", items: exact },
    ...Object.entries(domainTitles).map(([id, title]) => ({ title, items: concepts.filter((c) => domainOf[c.id] === id) })),
    { title: "勘定科目", items: accounts },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <Input placeholder="用語を検索" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" aria-label="用語を検索" />
      {groups.map((g) => (
        <section key={g.title} className="space-y-3">
          <h2 className="text-lg font-semibold">{g.title}</h2>
          <dl className="space-y-3">
            {g.items.map((e) => (
              <div key={e.id} id={e.id} className="rounded-md border p-3 scroll-mt-20">
                <dt className="font-medium flex items-center gap-2">
                  {e.name}
                  {e.element && <ElementBadge element={e.element} contra={e.contra} size="xs" />}
                </dt>
                <dd className="mt-1 text-sm space-y-1">
                  {e.aliases.length > 0 && <p className="text-xs text-muted-foreground">別名: {e.aliases.join("、")}</p>}
                  <p>{e.short}</p>
                  <p className="text-muted-foreground">{e.summary}</p>
                  {e.example && <p className="text-muted-foreground">例: {e.example}</p>}
                  {e.related.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      関連:{" "}
                      {e.related.map((r, i) => (
                        <span key={r.id}>
                          {i > 0 && "、"}
                          <a
                            href={`#${r.id}`}
                            className="underline"
                            // 絞り込み中は関連先が描画されていないので、検索を解いて DOM に戻してからブラウザのアンカー移動に任せる
                            onClick={() => flushSync(() => setQuery(""))}
                          >
                            {r.name}
                          </a>
                        </span>
                      ))}
                    </p>
                  )}
                  {e.unit && (
                    <Link href={`/units/${e.unit.id}`} className="text-xs underline">
                      詳しく: {e.unit.title}
                    </Link>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {hits.length === 0 && <p className="text-sm text-muted-foreground">該当する用語がありません。</p>}
    </div>
  );
}

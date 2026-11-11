import Link from "next/link";
import { paths } from "#content";
import { LEVEL_LABELS, sortedDomains, sortedTopics, unitsOfTopic } from "@/lib/content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">会計を原理から、手を動かして学ぶ</h1>
        <p className="text-muted-foreground">
          短い解説を読み、その場で仕訳を切り、5要素と財務諸表がどう動くかを確かめる。暗記ではなく「なぜ」を積み上げる学習サイトです。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">学習パス</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {paths.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/paths/${p.id}`} className="hover:underline">
                    {p.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{p.summary}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">テーマから学ぶ</h2>
        {sortedDomains.map((d) => {
          const topicsInDomain = sortedTopics.filter((t) => t.domain === d.id);
          if (topicsInDomain.length === 0) return null;
          return (
            <div key={d.id} className="space-y-2">
              <h3 className="font-medium">{d.title}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {topicsInDomain.map((t) => {
                  const units = unitsOfTopic(t.id);
                  const levels = [...new Set(units.map((u) => u.level))].map((l) => LEVEL_LABELS[l]).join("・");
                  return (
                    <li key={t.id} className="rounded-md border p-3">
                      <Link href={`/topics/${t.id}`} className="font-medium hover:underline">
                        {t.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">{t.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {units.length}単元({levels})
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { normalizeSearchText } from "@/lib/accounting";
import type { GlossaryEntry } from "@/lib/content";
import { ElementBadge } from "@/components/element-badge";
import { Input } from "@/components/ui/input";

// 用語集の検索。名前・別名・読み・shortの部分一致。規模が小さいので配列のフィルタで足りる

type GlossarySearchProps = {
  entries: GlossaryEntry[];
  domainTitles: Record<string, string>;
  domainOf: Record<string, string>;
};

// useSearchParamsは静的生成ではSuspenseの中でしか読めないので、URLを読む部分だけを分ける
export function GlossarySearchFromUrl(props: GlossarySearchProps) {
  const searchParams = useSearchParams();
  return <GlossarySearch {...props} urlQuery={searchParams.get("q") ?? ""} />;
}

export function GlossarySearch({ entries, domainTitles, domainOf, urlQuery = "" }: GlossarySearchProps & { urlQuery?: string }) {
  // 入力値はURLから毎回導かずstateに持つ。URLの同期は遅れて届くので、制御入力に使うとIMEの変換が崩れる
  const [query, setQuery] = useState(urlQuery);
  // ヘッダーの「用語集」など入力以外でURLが変わったとき。遅れて届くurlQueryではなく現在のURLを見て、打鍵中の入力を巻き戻さない
  // 遷移のURLはコミットまでwindow.locationに反映されないので、レンダー中の調整では読めず、エフェクトにする
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部(URL)との同期で、上記の理由でレンダー中にできない
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, [urlQuery]);
  // 単元から戻ったときに検索語を復元するためURLに持たせる(Issue #111)。打鍵ごとに履歴を増やさないようreplaceにする
  const updateQuery = (next: string) => {
    setQuery(next);
    window.history.replaceState(null, "", next ? `?q=${encodeURIComponent(next)}` : window.location.pathname);
  };
  const q = normalizeSearchText(query);
  const hits = q ? entries.filter((e) => [e.name, ...e.aliases, ...e.reading, e.short].some((t) => normalizeSearchText(t).includes(q))) : entries;
  // 説明文にだけ語を含む項目が分野の順で先に並ぶと、探している項目が埋もれる(Issue #86)
  const exact = q ? hits.filter((e) => [e.name, ...e.aliases, ...e.reading].some((t) => normalizeSearchText(t) === q)) : [];
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
      <Input placeholder="用語を検索" value={query} onChange={(e) => updateQuery(e.target.value)} className="max-w-sm" aria-label="用語を検索" />
      {groups.map((g) => (
        <section key={g.title} className="space-y-3">
          <h2 className="text-lg font-semibold">{g.title}</h2>
          <dl className="space-y-3">
            {g.items.map((e) => (
              <div key={e.id} id={e.id} className="rounded-md border p-3 scroll-mt-20">
                <dt className="font-medium flex items-center gap-2">
                  {e.name}
                  {e.element && <ElementBadge element={e.element} contra={e.contra} temporary={e.temporary} size="xs" />}
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
                            // 絞り込み中は関連先が描画されていないので、検索を解いてDOMに戻してからブラウザのアンカー移動に任せる
                            // アンカーもURLに含める。pushStateの同期をNext.jsが後から反映するとき、含めていないURLで上書きされるため
                            // replaceだと検索結果の履歴が消え、「戻る」で用語集から出てしまう(Issue #235)
                            onClick={() =>
                              query &&
                              flushSync(() => {
                                setQuery("");
                                window.history.pushState(null, "", `${window.location.pathname}#${r.id}`);
                              })
                            }
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
      {hits.length === 0 && (
        <p className="text-sm text-muted-foreground">該当する用語がありません。読みで見つからないときは、漢字の一部(例: 「現」)で試してください。</p>
      )}
    </div>
  );
}

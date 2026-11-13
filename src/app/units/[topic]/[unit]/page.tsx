import { Fragment } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { units } from "#content";
import { dependsOnUnit, misconceptionMap, nextUnit, sortedTopics, unitAccountList, unitMap } from "@/lib/content";
import { Markdown } from "@/components/markdown";
import { IdeShell, type MisconceptionInfo } from "@/components/ide/ide-shell";

export function generateStaticParams() {
  return units.map((u) => {
    const [topic, unit] = u.id.split("/");
    return { topic, unit };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string; unit: string }> }): Promise<Metadata> {
  const { topic, unit: unitSlug } = await params;
  const unit = unitMap.get(`${topic}/${unitSlug}`);
  return unit ? { title: unit.title } : {};
}

export default async function UnitPage({ params }: { params: Promise<{ topic: string; unit: string }> }) {
  const { topic: topicId, unit: unitSlug } = await params;
  const unit = unitMap.get(`${topicId}/${unitSlug}`);
  if (!unit) notFound();
  const next = nextUnit(unit);
  // 非表示テーマ(チュートリアル)にだけ、バナーから来た単元へ戻るリンクの宛先を渡す。
  // ?from=の値をこの一覧で検証し、任意のURLへ飛ばさない(Issue #224)
  const shownTopics = new Set(sortedTopics.map((t) => t.id));
  const returnTitles = shownTopics.has(unit.topic) ? undefined : Object.fromEntries(units.filter((u) => shownTopics.has(u.topic)).map((u) => [u.id, u.title]));

  const misconceptions: Record<string, MisconceptionInfo> = {};
  for (const m of misconceptionMap.values()) {
    const remediation = unitMap.get(m.remediation)!;
    misconceptions[m.id] = { id: m.id, name: m.name, description: m.description, correct: m.correct, remediation: { id: remediation.id, title: remediation.title, isLater: dependsOnUnit(remediation, unit.id) } };
  }

  return (
    <IdeShell
      unit={{
        id: unit.id,
        title: unit.title,
        sourcePath: `content/${unit.path}.md`,
        company: unit.scenario.company,
        era: unit.scenario.era,
        currency: unit.scenario.currency,
        opening: unit.scenario.opening,
        steps: unit.steps.map((s) => ({ title: s.title, task: s.task })),
        next: next ? { id: next.id, title: next.title } : undefined,
      }}
      accounts={unitAccountList(unit.scenario.accounts)}
      misconceptions={misconceptions}
      returnTitles={returnTitles}
      narratives={unit.steps.map((s, i) => (
        <Fragment key={i}>
          <Markdown body={s.narrative} />
          {/* 出典はふりかえりの下に並べる(ADR 0009) */}
          {i === unit.steps.length - 1 && unit.sources.length > 0 && (
            <section className="not-prose mt-6 space-y-2 border-t pt-4 text-sm">
              <h3 className="font-medium">出典</h3>
              <ul className="space-y-1">
                {unit.sources.map((src) => (
                  <li key={src.title}>
                    <p>{src.title}</p>
                    {src.note && <p className="text-muted-foreground">{src.note}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Fragment>
      ))}
    />
  );
}

import { notFound } from "next/navigation";
import { units } from "#content";
import { accountList, misconceptionMap, nextUnit, unitMap } from "@/lib/content";
import { Markdown } from "@/components/markdown";
import { IdeShell, type MisconceptionInfo } from "@/components/ide/ide-shell";

export function generateStaticParams() {
  return units.map((u) => {
    const [topic, unit] = u.id.split("/");
    return { topic, unit };
  });
}

export default async function UnitPage({ params }: { params: Promise<{ topic: string; unit: string }> }) {
  const { topic: topicId, unit: unitSlug } = await params;
  const unit = unitMap.get(`${topicId}/${unitSlug}`);
  if (!unit) notFound();
  const next = nextUnit(unit);

  const misconceptions: Record<string, MisconceptionInfo> = {};
  for (const m of misconceptionMap.values()) {
    const remediation = unitMap.get(m.remediation)!;
    misconceptions[m.id] = { id: m.id, name: m.name, description: m.description, correct: m.correct, remediation: { id: remediation.id, title: remediation.title } };
  }

  return (
    <IdeShell
      unit={{
        id: unit.id,
        title: unit.title,
        sourcePath: `content/${unit.path}.md`,
        company: unit.scenario.company,
        opening: unit.scenario.opening,
        steps: unit.steps.map((s) => ({ title: s.title, task: s.task })),
        next: next ? { id: next.id, title: next.title } : undefined,
      }}
      accounts={accountList}
      misconceptions={misconceptions}
      narratives={unit.steps.map((s, i) => (
        <Markdown key={i} body={s.narrative} />
      ))}
    />
  );
}

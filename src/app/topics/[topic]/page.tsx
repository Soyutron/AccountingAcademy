import { notFound } from "next/navigation";
import { topics } from "#content";
import { LEVEL_LABELS, unitsOfTopic } from "@/lib/content";
import { UnitList } from "@/components/unit-list";

export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.id }));
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: topicId } = await params;
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) notFound();
  const units = unitsOfTopic(topic.id);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{topic.title}</h1>
        <p className="text-muted-foreground">{topic.summary}</p>
        <p className="text-sm text-muted-foreground">入門から順に深くなります。前提となる単元は各単元の冒頭に示します。</p>
      </div>
      <UnitList units={units.map((u) => ({ id: u.id, title: u.title, level: LEVEL_LABELS[u.level], summary: u.summary }))} />
    </div>
  );
}

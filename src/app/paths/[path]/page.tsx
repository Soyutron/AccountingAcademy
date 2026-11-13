import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { paths } from "#content";
import { LEVEL_LABELS, unitMap } from "@/lib/content";
import { UnitList } from "@/components/unit-list";

export function generateStaticParams() {
  return paths.map((p) => ({ path: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ path: string }> }): Promise<Metadata> {
  const { path: pathId } = await params;
  const path = paths.find((p) => p.id === pathId);
  return path ? { title: path.title } : {};
}

export default async function PathPage({ params }: { params: Promise<{ path: string }> }) {
  const { path: pathId } = await params;
  const path = paths.find((p) => p.id === pathId);
  if (!path) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{path.title}</h1>
        <p className="text-muted-foreground">{path.summary}</p>
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          {path.exam ? (
            <>
              <p className="font-medium">{path.exam.name}</p>
              <p className="text-muted-foreground">{path.exam.format}</p>
              <a href={path.exam.source} className="text-xs underline" target="_blank" rel="noreferrer">
                試験の公式情報
              </a>
            </>
          ) : (
            <p className="text-muted-foreground">{path.era}</p>
          )}
        </div>
      </div>
      {path.sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <UnitList
            units={section.units.map((id) => {
              const u = unitMap.get(id)!;
              return { id: u.id, title: u.title, level: LEVEL_LABELS[u.level], summary: u.summary };
            })}
          />
        </section>
      ))}
    </div>
  );
}

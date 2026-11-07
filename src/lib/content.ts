import { accounts, domains, misconceptions, paths, topics, units, type Unit } from "#content";
import type { AccountInfo } from "./accounting";

// ビルド済みコンテンツ(.velite)への読み出し口。ページとコンポーネントはここを通して参照する

export const accountList = accounts.accounts;
export const accountMap: ReadonlyMap<string, AccountInfo> = new Map(accountList.map((a) => [a.id, a]));
export const conceptList = domains.flatMap((d) => d.concepts.map((c) => ({ ...c, domain: d.id })));
export const conceptMap = new Map(conceptList.map((c) => [c.id, c]));
export const misconceptionMap = new Map(misconceptions.misconceptions.map((m) => [m.id, m]));
export const unitMap = new Map(units.map((u) => [u.id, u]));

export const sortedDomains = [...domains].sort((a, b) => a.order - b.order);
export const sortedTopics = topics.filter((t) => !t.hidden).sort((a, b) => a.order - b.order);

export function unitsOfTopic(topicId: string): Unit[] {
  return units.filter((u) => u.topic === topicId).sort((a, b) => a.level - b.level || a.order - b.order);
}

export function getPath(id: string) {
  return paths.find((p) => p.id === id);
}

/** その概念を初めて説明する単元 */
export function introducingUnit(conceptId: string): Unit | undefined {
  return units.find((u) => u.introduces.includes(conceptId));
}

export const LEVEL_LABELS: Record<number, string> = { 1: "入門", 2: "基礎", 3: "応用", 4: "専門" };

// 用語ポップオーバーと用語集が使う、概念と勘定科目を同じ形にそろえた項目
export interface GlossaryEntry {
  id: string;
  kind: "concept" | "account";
  name: string;
  short: string;
  summary: string;
  example?: string;
  element?: AccountInfo["element"];
  contra?: boolean;
  related: { id: string; name: string }[];
  unit?: { id: string; title: string };
}

function nameOf(id: string): string {
  return conceptMap.get(id)?.name ?? accountMap.get(id)?.name ?? id;
}

export const glossary: GlossaryEntry[] = [
  ...conceptList.map((c) => ({
    id: c.id,
    kind: "concept" as const,
    name: c.name,
    short: c.short,
    summary: c.summary,
    example: c.example,
    // related と contrasts の両方に挙げる概念があるので、先に出た方だけ残す
    related: [...new Set([...c.requires, ...c.related, ...c.contrasts])].map((id) => ({ id, name: nameOf(id) })),
    unit: (() => {
      const u = introducingUnit(c.id);
      return u ? { id: u.id, title: u.title } : undefined;
    })(),
  })),
  ...accountList.map((a) => ({
    id: a.id,
    kind: "account" as const,
    name: a.name,
    short: a.short,
    summary: a.why,
    element: a.element,
    contra: a.contra,
    related: a.concepts.map((id) => ({ id, name: nameOf(id) })),
  })),
];

export const glossaryMap = new Map(glossary.map((g) => [g.id, g]));

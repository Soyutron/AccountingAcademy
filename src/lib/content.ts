import { accounts, domains, misconceptions, paths, topics, units, type Unit } from "#content";
import { type AccountInfo, accountSummary } from "./accounting";

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

/** ふりかえりから進む次の単元。テーマ末尾では次のテーマ(知識の正本の順。ADR 0002)の最初の単元 */
export function nextUnit(unit: Unit): Unit | undefined {
  const siblings = unitsOfTopic(unit.topic);
  const inTopic = siblings[siblings.findIndex((u) => u.id === unit.id) + 1];
  if (inTopic) return inTopic;
  // 非表示テーマ(チュートリアル)は順序の外なので、通常のテーマへはつながない
  const topicIdx = sortedTopics.findIndex((t) => t.id === unit.topic);
  if (topicIdx < 0) return undefined;
  for (const t of sortedTopics.slice(topicIdx + 1)) {
    const first = unitsOfTopic(t.id)[0];
    if (first) return first;
  }
  return undefined;
}

/** unitがtargetIdの単元を(前提の前提も含めて)前提にしているか。循環はveliteの検査で弾いている */
export function dependsOnUnit(unit: Unit, targetId: string): boolean {
  return unit.requires.some((id) => id === targetId || dependsOnUnit(unitMap.get(id)!, targetId));
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
  // 別名。概念と勘定科目の両方から集める
  aliases: string[];
  // ひらがなの読み。用語集の検索で引く
  reading: string[];
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

// 概念と勘定科目が同じIDを持つもの(小口現金など)は同じ用語なので、用語集では1項目にまとめる。
// 概念の説明(summary / example / 単元)を採り、勘定科目の要素を足す。関連に自分自身は並べない(Issue #24)
const accountById = new Map(accountList.map((a) => [a.id, a]));
export const glossary: GlossaryEntry[] = [
  ...conceptList.map((c) => {
    const account = accountById.get(c.id);
    const related = [...new Set([...c.requires, ...c.related, ...c.contrasts, ...(account?.concepts ?? [])])].filter((id) => id !== c.id);
    return {
      id: c.id,
      kind: "concept" as const,
      name: c.name,
      aliases: [...c.aliases, ...(account?.aliases ?? [])],
      reading: [...c.reading, ...(account?.reading ?? [])],
      short: c.short,
      summary: c.summary,
      example: c.example,
      element: account?.element,
      contra: account?.contra,
      // relatedとcontrastsの両方に挙げる概念があるので、先に出た方だけ残す
      related: related.map((id) => ({ id, name: nameOf(id) })),
      unit: (() => {
        const u = introducingUnit(c.id);
        return u ? { id: u.id, title: u.title } : undefined;
      })(),
    };
  }),
  ...accountList
    .filter((a) => !conceptMap.has(a.id))
    .map((a) => ({
      id: a.id,
      kind: "account" as const,
      name: a.name,
      aliases: a.aliases,
      reading: a.reading,
      short: a.short,
      summary: accountSummary(a),
      example: a.example,
      element: a.element,
      contra: a.contra,
      related: a.concepts.map((id) => ({ id, name: nameOf(id) })),
    })),
];

export const glossaryMap = new Map(glossary.map((g) => [g.id, g]));

// 結果ペインの科目名も本文と同じ説明を開く。このモジュールをクライアントで読むと全単元が同梱されるので、ページから項目ごと渡す(Issue #82)
export type GlossaryAccount = AccountInfo & { glossary: GlossaryEntry };
export const glossaryAccountList: GlossaryAccount[] = accountList.map((a) => ({ ...a, glossary: glossaryMap.get(a.id)! }));

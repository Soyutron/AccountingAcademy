import { describe, expect, it } from "vitest";
import { accountList, conceptMap, unitMap } from "./content";
import { units } from "#content";

// 図のaltは用語リンクにならないので、本文だけを見る
const prose = (narrative: string) => narrative.replace(/```[\s\S]*?```/g, "");
const linked = (text: string, id: string) => text.includes(`[[${id}|`) || text.includes(`[[${id}]]`);
// 「[[loan|貸付金・借入金]]」のように別の用語の表示語に含まれる語は、素のテキストとして数えない
const withoutLinks = (text: string) => text.replace(/\[\[[^\]]*\]\]/g, "");

// velite.config.tsのexplainedと同じく、requiresの単元を辿って説明済みの概念を集める
function explainedConcepts(unitId: string): Set<string> {
  const unit = unitMap.get(unitId)!;
  const result = new Set(unit.introduces);
  for (const req of unit.requires) explainedConcepts(req).forEach((c) => result.add(c));
  return result;
}

// Issue #142: 前提で説明済みの概念と勘定科目は、単元の本文に初めて出たステップで[[id]]として押せる
describe("用語の初出のリンク", () => {
  const targets = units.filter((u) => u.topic !== "tutorial").map((u) => u.id);

  it.each(targets)("%s: 用語名が最初に出るステップに[[id]]がある", (unitId) => {
    const unit = unitMap.get(unitId)!;
    const explained = explainedConcepts(unitId);
    const terms = [
      ...[...explained].map((id) => ({ id, name: conceptMap.get(id)!.name })),
      // 概念と同じIDの科目は、概念が未説明ならVeliteの検査に当たるのでリンクできない(次の単元の予告など)
      ...accountList.filter((a) => !conceptMap.has(a.id) || explained.has(a.id)).map((a) => ({ id: a.id, name: a.name })),
    ].filter((t) => t.name.length > 2 && !t.name.includes("・"));
    const texts = unit.steps.map((s) => prose(s.narrative));
    const bad = terms.flatMap(({ id, name }) => {
      const first = texts.findIndex((t) => withoutLinks(t).includes(name) || linked(t, id));
      return first >= 0 && !linked(texts[first], id) ? [`step${first + 1} ${name}(${id})`] : [];
    });
    expect([...new Set(bad)]).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { conceptMap, unitMap } from "./content";

// 図の alt は用語リンクにならないので、本文だけを見る
const prose = (narrative: string) => narrative.replace(/```[\s\S]*?```/g, "");
const linked = (text: string, id: string) => text.includes(`[[${id}|`) || text.includes(`[[${id}]]`);

// Issue #50: 単元が introduces に挙げた用語は、本文に初めて出たステップで [[id]] として押せる
describe("introduces の用語の初出", () => {
  it.each(["cash-and-deposits/checking-account", "depreciation/straight-line"])(
    "%s: 用語名が最初に出るステップに [[id]] がある",
    (unitId) => {
      const unit = unitMap.get(unitId)!;
      const bad: string[] = [];
      for (const id of unit.introduces) {
        const name = conceptMap.get(id)!.name;
        const texts = unit.steps.map((s) => prose(s.narrative));
        const first = texts.findIndex((t) => t.includes(name) || linked(t, id));
        if (first >= 0 && !linked(texts[first], id)) bad.push(`step${first + 1} ${name}`);
      }
      expect(bad).toEqual([]);
    },
  );
});

import { describe, expect, it } from "vitest";
import { pathErrors, unitKindErrors } from "./content-checks";

const steps = (...types: string[]) => types.map((type) => ({ task: { type } }));
const sources = [{ title: "ルカ・パチョーリ『スンマ』(1494年)" }];

// Issue #259: 単元のkindごとの課題の条件と出典の必須、パスのexam / eraの条件(ADR 0009)
describe("単元のkindと出典の検査", () => {
  it("lessonはpostかpredictが1つ以上要る", () => {
    expect(unitKindErrors({ kind: "lesson", level: 1, steps: steps("observe", "post", "observe") })).toEqual([]);
    expect(unitKindErrors({ kind: "lesson", level: 1, steps: steps("observe", "predict", "observe") })).toEqual([]);
    expect(unitKindErrors({ kind: "lesson", level: 1, steps: steps("observe", "classify", "observe") })).toEqual(["postかpredictのステップが1つもない"]);
  });

  it.each(["history", "forensics"] as const)("%sはobserve以外のtaskが1つあれば通り、observeだけなら拒否する", (kind) => {
    expect(unitKindErrors({ kind, level: 1, sources, steps: steps("observe", "classify", "observe") })).toEqual([]);
    expect(unitKindErrors({ kind, level: 1, sources, steps: steps("observe", "observe", "observe") })).toHaveLength(1);
  });

  it.each(["history", "forensics"] as const)("%sはsourcesが無いか空なら拒否する", (kind) => {
    expect(unitKindErrors({ kind, level: 1, steps: steps("observe", "post") })).toEqual([`kind: ${kind}の単元にsourcesがない`]);
    expect(unitKindErrors({ kind, level: 1, sources: [], steps: steps("observe", "post") })).toEqual([`kind: ${kind}の単元にsourcesがない`]);
  });

  it("lessonは深さ3以上でだけsourcesが要る", () => {
    expect(unitKindErrors({ kind: "lesson", level: 2, steps: steps("observe", "post") })).toEqual([]);
    expect(unitKindErrors({ kind: "lesson", level: 3, steps: steps("observe", "post") })).toEqual(["深さ3の単元にsourcesがない"]);
    expect(unitKindErrors({ kind: "lesson", level: 4, sources, steps: steps("observe", "post") })).toEqual([]);
  });
});

describe("パスのexamとera", () => {
  const exam = { name: "日商簿記3級", format: "ネット試験", source: "https://example.com" };

  it("examかeraのどちらかがあれば通る", () => {
    expect(pathErrors({ exam })).toEqual([]);
    expect(pathErrors({ era: "中世イタリアから現代へ" })).toEqual([]);
  });

  it("両方無ければ拒否する", () => {
    expect(pathErrors({})).toEqual(["examとeraのどちらも無い"]);
  });
});

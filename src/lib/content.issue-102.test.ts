import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { toHiragana } from "./accounting";

type RawConcept = { id: string; reading?: string[] };
const concepts: RawConcept[] = readdirSync("content/concepts").flatMap(
  (file) => parse(readFileSync(`content/concepts/${file}`, "utf8")).concepts,
);

describe("content/concepts(Issue #102)", () => {
  it.each(concepts.map((c) => [c.id, c] as const))("%sに読み(ひらがな)がある", (_id, concept) => {
    expect(concept.reading?.length).toBeGreaterThan(0);
    for (const r of concept.reading ?? []) expect(r).toMatch(/^[ぁ-ゖー]+$/);
  });
});

describe("toHiragana(Issue #102)", () => {
  it("カタカナをひらがなにそろえ、漢字はそのまま残す", () => {
    expect(toHiragana("シワケ")).toBe("しわけ");
    expect(toHiragana("現金")).toBe("現金");
  });
});
